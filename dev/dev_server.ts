import { Colors, fs, path, slash } from "../deps.ts";
import { Argparser } from "../src/data/util/argparser.ts";
import { DefaultConfigDir } from "../src/util.ts";
import { isWindows, process } from "./internal/util.ts";

Deno.chdir(path.dirname(path.fromFileUrl(import.meta.url)));
Deno.chdir("..");

interface Action {
  id: string;
  /**
   * Whether to run the action on startup (default) or only when a matching file has changed.
   */
  runOnStart?: boolean;
  match: RegExp;
  fn: () => Deno.Process;
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
  private readonly processes: { [id: string]: Deno.Process } = {};
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
    this.runActions(
      this.config.actions.filter((a) =>
        a.runOnStart === undefined || a.runOnStart
      ),
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
    this.timeout = setTimeout(() => {
      if (paths.size === 0) {
        return;
      }
      const actions = this.filterMatchingActions(Array.from(paths));
      if (actions.length) {
        DevServer.log(
          `Detected change. Restarting ${
            actions.map((a) => a.id).join(", ")
          }...`,
        );
        this.runActions(actions);
      }
      paths.clear();
    }, 350);
  }

  private runActions(actions: Action[]) {
    for (const action of actions) {
      if (this.processes[action.id]) {
        this.processes[action.id].close();
      }
      this.processes[action.id] = action.fn();
    }
  }

  private filterMatchingActions(paths: string[]): Action[] {
    return this.config.actions.filter((c) =>
      Boolean(paths.find((path) => slash(path).match(c.match)))
    );
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
  fn: () => Deno.Process,
): () => Deno.Process {
  return () => {
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
    return fn();
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
        fn: process(
          undefined,
          "deno",
          "run",
          "--lock=lock.json",
          "--no-check",
          `--allow-all`,
          "--unstable",
          "src/main.ts",
          `--host=${options.host}`,
          `--port=${options.port}`,
          `--debug=${options.debug || false}`,
          `--secure=${options.secure}`,
          options.key && `--key=${options.key || "-"}`,
          options.cert && `--cert=${options.cert || "-"}`,
        ),
      },
      {
        id: "Icons",
        match: /icon\.(ts)/,
        fn: process(
          undefined,
          "deno",
          "run",
          "--lock=lock.json",
          "--no-check",
          "--allow-read",
          "--allow-write",
          "dev/generate_icons.ts",
        ),
        runOnStart: false,
      },
      {
        id: "JS",
        match: /\/assets\/(.+)\.(ts)/,
        fn: removeAndThen(
          "assets/dist",
          "index*js*",
          process(
            undefined,
            "deno",
            "bundle",
            "--lock=lock.json",
            "--unstable",
            "assets/index.ts",
            "assets/dist/index.js",
          ),
        ),
      },
      {
        id: "SCSS",
        match: /\/assets\/(.+)\.(scss)/,
        fn: removeAndThen(
          "assets/dist",
          "index*css*",
          process(
            undefined,
            `sass${isWindows() ? ".cmd" : ""}`,
            "-I",
            "assets/node_modules",
            "assets/index.scss",
            "assets/dist/index.css",
          ),
        ),
      },
    ],
  };

  await new DevServer(config).start();
}
