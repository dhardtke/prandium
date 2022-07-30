import { Colors, flags, fs, path, slash } from "../deps.ts";
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
        this.processes[action.id].close!();
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
      process.close!();
    },
  };
}

const PARSE_OPTIONS: flags.ParseOptions = {
  boolean: [
    "debug",
    "secure",
  ],
  default: {
    port: 8000,
    host: "127.0.0.1",
    debug: true,
    configDir: DefaultConfigDir,
    secure: false,
    cert: "",
    key: "",
  },
};
const HELP_TEXT = `
  Usage: COMMAND

  Options:
    --help               - Show help text
    --port=[number]      - the port number                                        (Default: ${PARSE_OPTIONS.default!.port})
    --host=[string]      - the host name                                          (Default: "${PARSE_OPTIONS.default!.host}")
    --debug=[boolean]    - enable debug mode                                      (Default: ${PARSE_OPTIONS.default!.debug})
    --configDir=[string] - The config dir                                         (Default: "${PARSE_OPTIONS.default!.configDir}")
    --secure=[boolean]   - enable HTTPS server                                    (Default: ${PARSE_OPTIONS.default!.secure})
    --cert=[string]      - path to a certificate file to use for the HTTPS server (Default: "${PARSE_OPTIONS.default!.cert}")
    --key=[string]       - path to a key file to use for the HTTPS server         (Default: "${PARSE_OPTIONS.default!.key}")
`.trim();

function parseOptions(args: string[]): Options {
  const options = flags.parse(args, PARSE_OPTIONS) as unknown as Options;

  if ("help" in options) {
    console.log(HELP_TEXT);
    Deno.exit(0);
  }

  return options;
}

if (import.meta.main) {
  const options: Options = parseOptions(Deno.args);

  fs.ensureDirSync("out/assets");

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
        // TODO use deno task once https://github.com/denoland/deno/issues/14293 is fixed
        process: call(
          undefined,
          "deno",
          "run",
          "--config=deno.jsonc",
          "--lock=lock.json",
          "--no-check",
          `--allow-all`,
          "--unstable",
          "src/main.ts",
          `--host=${options.host}`,
          `--port=${options.port}`,
          `--debug=${(typeof options.debug !== "undefined")}`,
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
          "out/assets",
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
          "out/assets",
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
