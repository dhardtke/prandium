import {path, slash} from "./deps.ts";
import config from "./dev.config.ts";

Deno.chdir(path.dirname(path.fromFileUrl(import.meta.url)));
Deno.chdir("..");

export type Command = string[];

export interface Action {
    id: string;
    match: RegExp;
    cmd: Command;
}

export interface DevServerConfig {
    actions: Action[];
    watchPaths: string[];
}

// TODO create dist folder beforehand
// TODO recover on errors
class DevServer {
    private static NS: string = "dev-server";

    private config: DevServerConfig;
    private readonly processes: {[id: string]: Deno.Process} = {};
    private timeout: number | undefined = undefined;

    constructor(config: DevServerConfig) {
        this.config = config;
    }

    async start() {
        const watcher = Deno.watchFs(config.watchPaths);
        this.runActions(config.actions);
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
            this.processes[action.id] = Deno.run({
                cmd: action.cmd
            });
        }
    }

    private filterMatchingActions(paths: string[]): Action[] {
        return config.actions.filter(c => Boolean(paths.find(path => slash(path).match(c.match))));
    }

    private static log(msg: string): void {
        console.log(`[${DevServer.NS}] ${msg}\n`);
    }
}

if (import.meta.main) {
    await new DevServer(config).start();
}
