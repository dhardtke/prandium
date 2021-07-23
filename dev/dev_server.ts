import { Cliffy, Colors, fs, path, slash } from "../deps.ts";
import { isWindows, process } from "./internal/util.ts";

Deno.chdir(path.dirname(path.fromFileUrl(import.meta.url)));
Deno.chdir("..");

const ACTIONS_EXECUTION_DEBOUNCE_DELAY = 350;

interface Action {
  id: string;
  /**
   * Whether to run the action on startup (default) or only when a matching file has changed.
   */
  runOnStart?: boolean;
  match: RegExp;
  fn: () => Deno.Process;
  /**
   * Whether the page should reload after this action has completed successfully.
   * If true, the page should be reloaded once the process has ended.
   * If false, the page should not be reloaded.
   * If a number the page should be reloaded after the configured number of milliseconds have passed since starting the process.
   */
  reload?: boolean | number;
}

interface DevServerConfig {
  /**
   * The address of the watch server.
   */
  watchServer: string;

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
  private readonly worker: Worker;
  private readonly processes: { [id: string]: Deno.Process } = {};
  private timeout: number | undefined = undefined;

  constructor(config: DevServerConfig) {
    this.config = config;
    this.worker = new Worker(
      new URL("./dev_worker.ts", import.meta.url).href,
      {
        type: "module",
        // @ts-ignore IntelliJ hiccup
        deno: {
          namespace: true,
        },
      },
    );
  }

  private static shouldIncludePath(path: string, event: Deno.FsEvent): boolean {
    // Ignore JetBrains temporary files
    if (path.endsWith("~")) {
      return false;
    }
    // ignore directory timestamp modifications
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
      await this.refreshHook(paths);
    }
  }

  private async refreshHook(paths: Set<string>) {
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
          `Detected change. Restarting ${
            actions.map((a) => a.id).join(", ")
          }...`,
        );
        await this.runActions(actions, true);
      }
      paths.clear();
    }, ACTIONS_EXECUTION_DEBOUNCE_DELAY);
  }

  private async runActions(actions: Action[], mayReload = false) {
    let reload: boolean | number = false;
    for (const action of actions) {
      if (this.processes[action.id]) {
        this.processes[action.id].close();
      }
      this.processes[action.id] = action.fn();
      if (mayReload && Boolean(action.reload)) {
        if (action.reload === true) {
          reload = reload || true;
        } else {
          reload = Math.max(Number(reload), action.reload as number);
        }
      }
    }
    // TODO: Update logic to include error message in worker message without blocking
    if (reload) {
      for (const action of actions) {
        const process = this.processes[action.id];
        if (action.reload === true) {
          await process.status();
        }
      }
      setTimeout(() => {
        // tell worker to send reload message to clients
        this.worker.postMessage("reload");
      }, Number(reload));
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
  watchServer: string;
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
  const { options }: { options: Options } = await new Cliffy.Command()
    .option("-p, --port [port:number]", "the port number.", {
      default: 8000,
    })
    .option("-h, --host [hostname]", "the host name.", {
      default: "127.0.0.1",
    })
    .option("-w, --watchServer [address]", "the host and port under which the watch server will be spawned", {
      default: "127.0.0.1:8080"
    })
    .option("-d, --debug [debug:boolean]", "enable debug mode", {
      default: true,
    })
    .option("-s, --secure [secure:boolean]", "enable HTTPS server", {
      default: false,
    })
    .option(
      "--cert [cert:string]",
      "path to a certificate file to use for the HTTPS server",
    )
    .option(
      "--key [key:string]",
      "path to a key file to use for the HTTPS server",
    )
    .parse(Deno.args);

  // ensure assets/dist exists
  fs.ensureDirSync("assets/dist");

  const config: DevServerConfig = {
    watchServer: options.watchServer,
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
          `--watchServer=${options.watchServer}`,
          options.key && `--key=${options.key || "-"}`,
          options.cert && `--cert=${options.cert || "-"}`,
        ),
        reload: 500,
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
        reload: true,
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
        reload: true,
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
        reload: true,
      },
    ],
  };

  await new DevServer(config).start();
}
