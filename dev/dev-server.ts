import { Colors, fs, path, slash } from "../deps.ts";
import { Argparser } from "../src/data/parse/argparser.ts";
import { DefaultConfigDir } from "../src/shared/util.ts";
import { call, ProcessLike } from "./internal/util.ts";

Deno.chdir(path.dirname(path.fromFileUrl(import.meta.url)));
Deno.chdir("..");

interface Action {
  id: string;
  /**
   * Whether to run the action on startup (default) or only when a matching file has changed.
   */
  runOnStart?: boolean;
  match: RegExp;
  process: ProcessLike;
}

interface DevServerConfig {
  /**
   * The actions that should be executed on changes.
   */
  actions: Action[];

  /**
   * The paths that should be watched.
   */
  watchPaths: string[];
}

class DevServer {
  private static NS = "dev-server";

  private config: DevServerConfig;
  private readonly processes: { [id: string]: ProcessLike } = {};
  private timeout: number | undefined = undefined;

  constructor(config: DevServerConfig) {
    this.config = config;
  }

  private static shouldIncludePath(path: string, event: Deno.FsEvent): boolean {
    // Ignore JetBrains temporary files
    if (path.endsWith("~")) {
      return false;
    }
    // ignore modification of directory's timestamp
    return !(event.kind === "modify" && DevServer.isDirectory(path));
  }

  private static isDirectory(path: string): boolean {
    try {
      return Deno.statSync(path).isDirectory;
    } catch {
      return false;
    }
  }

  private static log(msg: string): void {
    const prefix = Colors.blue(`[${DevServer.NS}]`);
    console.log(`${prefix} ${msg}`);
  }

  async start() {
    const watcher = Deno.watchFs(this.config.watchPaths);
    await this.runActions(
      this.config.actions.filter((a) => a.runOnStart === undefined || a.runOnStart),
    );
    DevServer.log("Watcher is up and running...");

    const paths: Set<string> = new Set();
    for await (const event of watcher) {
      for (const path of event.paths) {
        if (DevServer.shouldIncludePath(path, event)) {
          paths.add(path);
        }
      }
      this.refreshHook(paths);
    }
  }

  private refreshHook(paths: Set<string>) {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
    this.timeout = setTimeout(async () => {
      if (paths.size === 0) {
        return;
      }
      const actions = this.filterMatchingActions(Array.from(paths));
      if (actions.length) {
        DevServer.log(
          `Detected change. Restarting ${actions.map((a) => a.id).join(", ")}...`,
        );
        await this.runActions(actions);
      }
      paths.clear();
    }, 350);
  }

  private async runActions(actions: Action[]) {
    for (const action of actions) {
      if (this.processes[action.id]) {
        this.processes[action.id].close();
      }
      this.processes[action.id] = action.process;
      await this.processes[action.id].run();
    }
  }

  private filterMatchingActions(paths: string[]): Action[] {
    return this.config.actions.filter((c) => Boolean(paths.find((path) => slash(path).match(c.match))));
  }
}

interface Options {
  port: number;
  host: string;
  debug?: boolean;
  secure?: boolean;
  cert?: string;
  key?: string;
}

function removeAndThen(
  dir: string,
  glob: string,
  process: ProcessLike,
): ProcessLike {
  return {
    async run() {
      const pattern = path.globToRegExp(glob, {
        extended: true,
        globstar: true,
      });
      for (const f of fs.walkSync(dir)) {
        if (f.name.match(pattern)) {
          try {
            Deno.removeSync(f.path);
          } catch {
            // ignore
          }
        }
      }
      await process.run();
    },
    close() {
      process.close();
    },
  };
}

if (import.meta.main) {
  const argparser = new Argparser<Options>([
    {
      name: "help",
      description: "Show help text",
      type: "void",
    },
    {
      name: "port",
      description: "the port number",
      default: 8000,
      type: "number",
    },
    {
      name: "host",
      description: "the host name",
      default: "127.0.0.1",
      type: "string",
    },
    {
      name: "debug",
      description: "enable debug mode",
      type: "boolean",
      default: true,
    },
    {
      name: "configDir",
      description: "The config dir",
      default: DefaultConfigDir,
      type: "string",
    },
    {
      name: "secure",
      description: "enable HTTPS server",
      type: "boolean",
    },
    {
      name: "cert",
      description: "path to a certificate file to use for the HTTPS server",
      type: "string",
      default: "",
    },
    {
      name: "key",
      description: "path to a key file to use for the HTTPS server",
      type: "string",
      default: "",
    },
  ]);
  const options: Options = argparser.parse(Deno.args);

  if ("help" in options) {
    console.log(argparser.help());
    Deno.exit(0);
  }

  // ensure assets/dist exists
  fs.ensureDirSync("assets/dist");

  const config: DevServerConfig = {
    watchPaths: [
      "src",
      "assets",
      "deps.ts",
      "lock.json",
    ],
    actions: [
      {
        id: "Server",
        match: /(deps\.ts|lock\.json|\/src\/(.+)\.(ts|html))/,
        process: call(
          undefined,
          "deno",
          "task",
          "run:debug",
          "--",
          `--host=${options.host}`,
          `--port=${options.port}`,
          `--secure=${options.secure}`,
          options.key && `--key=${options.key || "-"}`,
          options.cert && `--cert=${options.cert || "-"}`,
        ),
      },
      {
        id: "Icons",
        match: /icon\.ts/,
        process: call(
          undefined,
          "deno",
          "task",
          "generate-icons",
        ),
        runOnStart: false,
      },
      {
        id: "Ingredient parser",
        match: /parser\.pegjs/,
        process: call(
          undefined,
          "deno",
          "task",
          "build:ingredient-parser",
        ),
        runOnStart: false,
      },
      {
        id: "JS",
        match: /\/assets\/(.+)\.(ts)/,
        process: removeAndThen(
          "assets/dist",
          "index*js*",
          call(
            undefined,
            "deno",
            "task",
            "build:assets:js",
          ),
        ),
      },
      {
        id: "SCSS",
        match: /\/assets\/(.+)\.(scss)/,
        process: removeAndThen(
          "assets/dist",
          "index*css*",
          call(
            undefined,
            "deno",
            "task",
            "build:assets:css",
          ),
        ),
      },
    ],
  };

  await new DevServer(config).start();
}
