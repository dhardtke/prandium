import {initDb} from "./data/db.ts";
import {log, path} from "./deps.ts";
import {spawnServer} from "./http/webserver.ts";
import {Cliffy} from "../dev/deps.ts";

interface Options {
    debug?: boolean;
    host: string;
    port: number;
}

async function parseOptions(): Promise<Options> {
    const {options} = await new Cliffy.Command()
        .option("-p, --port [port:number]", "the port number.", {default: 8000})
        .option("-h, --host [hostname]", "the host name.", {default: "127.0.0.1"})
        .option("-d, --debug [debug:boolean]", "enable debug mode")
        .parse(Deno.args);
    return options;
}

async function setupLogger(debug?: boolean) {
    await log.setup({
        handlers: {
            console: new log.handlers.ConsoleHandler("DEBUG")
        },

        loggers: {
            default: {
                level: debug ? "DEBUG" : "INFO",
                handlers: ["console"]
            }
        }
    });
}

async function main(): Promise<void> {
    const options = await parseOptions();
    await setupLogger(options.debug);
    Deno.chdir(path.dirname(path.fromFileUrl(import.meta.url)));
    initDb();
    await spawnServer(options.host, options.port);
}

if (import.meta.main) {
    main().catch(e => console.error(e));
}
