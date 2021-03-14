import { Database } from "./data/db.ts";
import { Cliffy, log, LogRecord, fs, Colors } from "./deps.ts";
import { spawnServer } from "./http/webserver.ts";
import { DEFAULT_CONFIG_DIR, defaultConfigDir } from "./util.ts";

interface Options {
  debug?: boolean;
  host: string;
  port: number;
  configDir: string;
}

async function parseOptions(): Promise<Options> {
  const { options }: { options: Options } = await new Cliffy.Command()
    .option("-p, --port [port:number]", "the port number.", { default: 8000 })
    .option("-h, --host [hostname]", "the host name.", { default: "127.0.0.1" })
    .option("-d, --debug [debug:boolean]", "enable debug mode")
    .option("-c --configDir [config:string]", "The config directory", {
      default: DEFAULT_CONFIG_DIR,
    })
    .parse(Deno.args);

  if (options.configDir === DEFAULT_CONFIG_DIR) {
    options.configDir = defaultConfigDir();
  }

  fs.ensureDirSync(options.configDir);

  return options;
}

function formatLogRecord(logRecord: LogRecord): string {
  const colors: Record<number, (str: string) => string> = {
    [log.LogLevels.NOTSET]: Colors.red,
    [log.LogLevels.DEBUG]: Colors.gray,
    [log.LogLevels.INFO]: Colors.brightBlue,
    [log.LogLevels.WARNING]: Colors.yellow,
    [log.LogLevels.ERROR]: Colors.red,
    [log.LogLevels.CRITICAL]: Colors.brightRed,
  };
  const levelName = log.LogLevels[logRecord.level];
  const color = colors[logRecord.level];
  return `${color(levelName)} ${logRecord.msg}`;
}

async function setupLogger(debug?: boolean) {
  await log.setup({
    handlers: {
      console: new log.handlers.ConsoleHandler("DEBUG", {
        formatter: formatLogRecord,
      }),
    },
    loggers: {
      default: {
        level: debug ? "DEBUG" : "INFO",
        handlers: ["console"],
      },
    },
  });
}

async function main(): Promise<void> {
  const options = await parseOptions();
  await setupLogger(options.debug);
  const database = new Database(options.configDir);
  await database.migrate();

  await spawnServer({
    host: options.host,
    port: options.port,
    debug: options.debug,
    db: database,
  });
}

if (import.meta.main) {
  await main();
}
