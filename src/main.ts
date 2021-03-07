import {initDb} from "./data/db.ts";
import {log, LogRecord, path} from "./deps.ts";
import {spawnServer} from "./http/webserver.ts";
import {Cliffy, Colors} from "../dev/deps.ts";

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

function formatLogRecord(logRecord: LogRecord): string {
    const colors: { [l in keyof typeof log.LogLevels]: (s: string) => string } = {
        NOTSET: Colors.red,
        DEBUG: Colors.gray,
        INFO: Colors.brightBlue,
        WARNING: Colors.yellow,
        ERROR: Colors.red,
        CRITICAL: Colors.brightRed
    }
    const levelEnum: keyof typeof log.LogLevels = log.LogLevels[logRecord.level] as any;
    const color = colors[levelEnum];
    return `${color(levelEnum)} ${logRecord.msg}`;
}

async function setupLogger(debug?: boolean) {
    await log.setup({
        handlers: {
            console: new log.handlers.ConsoleHandler("DEBUG", {
                formatter: formatLogRecord
            })
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
    await main();
}
