import { Cliffy, Colors, fs, log, LogRecord, path } from "../deps.ts";
import { Database } from "./data/db.ts";
import { spawnServer } from "./http/webserver.ts";
import { readFromDisk, Settings } from "./settings.ts";
import { DefaultConfigDir, defaultConfigDir } from "./util.ts";

interface Options {
  host: string;
  port: number;
  configDir: string;
  debug?: boolean;
  secure?: boolean;
  cert?: string;
  key?: string;
}

async function parseOptions(): Promise<Options> {
  const { options }: { options: Options } = await new Cliffy.Command()
    .option("-p, --port [port:number]", "the port number.", { default: 8000 })
    .option("-h, --host [hostname]", "the host name.", { default: "127.0.0.1" })
    .option("-d, --debug [debug:boolean]", "enable debug mode")
    .option("-c --configDir [config:string]", "The config directory", {
      default: DefaultConfigDir,
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

  if (options.configDir === DefaultConfigDir) {
    options.configDir = defaultConfigDir();
  }

  return options;
}

async function prepareConfigDir(options: Options) {
  await fs.ensureDir(options.configDir);
  await fs.ensureDir(path.join(options.configDir, "thumbnails"));
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

async function main(): Promise<number> {
  const options = await parseOptions();
  await prepareConfigDir(options);
  await setupLogger(options.debug);
  let settings: Settings;
  try {
    settings = await readFromDisk(options.configDir);
  } catch (e) {
    log.error(e);
    return 1;
  }
  const database = new Database(options.configDir);
  database.migrate();

  await spawnServer({
    ...options,
    db: database,
    settings,
  });

  return 0;
}

if (import.meta.main) {
  await main();
}
