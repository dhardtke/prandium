import {Colors, Cliffy, existsSync, path, slash, fs} from "./deps.ts";
import {process} from "./util.ts";

Deno.chdir(path.dirname(path.fromFileUrl(import.meta.url)));
Deno.chdir("..");

interface Action {
    id: string;
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
    private static NS: string = "dev-server";

    private config: DevServerConfig;
    private readonly processes: { [id: string]: Deno.Process } = {};
    private timeout: number | undefined = undefined;

    constructor(config: DevServerConfig) {
        this.config = config;
    }

    async start() {
        const watcher = Deno.watchFs(this.config.watchPaths);
        this.runActions(this.config.actions);
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
                DevServer.log(`Detected change. Restarting ${actions.map(a => a.id).join(", ")}...`);
                this.runActions(actions);
            }
            paths.clear();
        }, 350);
    }

    private static shouldIncludePath(path: string, event: Deno.FsEvent): boolean {
        // Ignore JetBrains temporary files
        if (path.endsWith("~")) {
            return false;
        }
        if (!existsSync(path)) {
            return false;
        }
        // ignore modification of directory's timestamp
        return !(event.kind === "modify" && DevServer.isDirectory(path));
    }

    private static isDirectory(path: string): boolean {
        return Deno.statSync(path).isDirectory;
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
        return this.config.actions.filter(c => Boolean(paths.find(path => slash(path).match(c.match))));
    }

    private static log(msg: string): void {
        const prefix = Colors.blue(`[${DevServer.NS}]`);
        console.log(`${prefix} ${msg}`);
    }
}

interface Options {
    port: number;
    host: string;
    debug?: boolean;
}

if (import.meta.main) {
    const {options}: { options: Options } = await new Cliffy.Command()
        .option("-p, --port [port:number]", "the port number.", {default: 8000})
        .option("-h, --host [hostname]", "the host name.", {default: "127.0.0.1"})
        .option("-d, --debug [debug:boolean]", "enable debug mode", {default: true})
        .parse(Deno.args);

    // ensure assets/dist exists
    fs.ensureDirSync("assets/dist");

    const config: DevServerConfig = {
        watchPaths: [
            "src",
            "assets"
        ],
        actions: [
            {
                id: "Server",
                match: /\/src\/(.+)\.(ts|html)/,
                fn: process(undefined, "deno", "run", "--no-check", `--allow-net=${options.host}`, "--allow-read", "--allow-write", "--unstable",
                    "src/main.ts", `--host=${options.host}`, `--port=${options.port}`, `--debug=${options.debug || false}`)
            },
            {
                id: "JS",
                match: /\/assets\/(.+)\.(ts)/,
                fn: process(undefined, "deno", "bundle", "--unstable", "assets/index.ts", "assets/dist/index.js")
            },
            {
                id: "SCSS",
                match: /\/assets\/(.+)\.(scss)/,
                fn: process(undefined, "sass", "-I", "assets/node_modules", "assets/index.scss", "assets/dist/index.css")
            }
        ]
    };

    await new DevServer(config).start();
}
