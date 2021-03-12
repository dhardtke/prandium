import {Database} from "./data/db.ts";
import {log, LogRecord, path} from "./deps.ts";
import {spawnServer} from "./http/webserver.ts";
import {Cliffy, Colors, fs} from "../dev/deps.ts";
import {getHome} from "./util.ts";

interface Options {
    debug?: boolean;
    host: string;
    port: number;
    configDir: string;
}

const DEFAULT_CONFIG_DIR = "~/.cookguide";

async function parseOptions(): Promise<Options> {
    const {options}: { options: Options } = await new Cliffy.Command()
        .option("-p, --port [port:number]", "the port number.", {default: 8000})
        .option("-h, --host [hostname]", "the host name.", {default: "127.0.0.1"})
        .option("-d, --debug [debug:boolean]", "enable debug mode")
        .option("-c --configDir [config:string]", "The config directory", {default: DEFAULT_CONFIG_DIR})
        .parse(Deno.args);

    if (options.configDir === DEFAULT_CONFIG_DIR) {
        const home = getHome();
        if (!home) {
            throw new Error("Could not read home directory.");
        }
        options.configDir = path.resolve(home, ".cookguide");
    }

    fs.ensureDirSync(options.configDir);

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
    Deno.chdir(path.dirname(path.fromFileUrl(import.meta.url)));

    const options = await parseOptions();
    await setupLogger(options.debug);
    const database = new Database(options.configDir);
    await database.migrate();

    await spawnServer({host: options.host, port: options.port, debug: options.debug, db: database});
}

if (import.meta.main) {
    await main();
}
