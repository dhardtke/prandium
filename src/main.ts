import { Colors, container, fs, log, LogRecord, path } from "../deps.ts";
import { Database } from "./data/db.ts";
import { Argparser } from "./data/parse/argparser.ts";
import { readFromDisk, Settings } from "./data/settings.ts";
import { buildDbPath } from "./data/util/build-db-path.ts";
import { CONFIG_DIR, Disposable, SETTINGS } from "./di.ts";
import { spawnServer } from "./http/webserver.ts";
import { DefaultConfigDir, defaultConfigDir, IS_COMPILED } from "./shared/util.ts";

// workaround for https://github.com/dyedgreen/deno-sqlite/issues/174
Deno.flockSync = () => {
};
Deno.funlockSync = () => {
};

interface Options {
  host: string;
  port: number;
  configDir: string;
  debug?: boolean;
  secure?: boolean;
  cert?: string;
  key?: string;
}

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
  let options: Options;
  try {
    options = argparser.parse(Deno.args);

    if ("help" in options) {
      console.log(argparser.help());
      return 0;
    }

    if (options.configDir === DefaultConfigDir) {
      options.configDir = defaultConfigDir();
    }
  } catch (e) {
    console.error(e.message);
    console.log(argparser.help());
    return 1;
  }

  await prepareConfigDir(options);
  await setupLogger(options.debug);
  let settings: Settings;
  try {
    settings = await readFromDisk(options.configDir);
  } catch (e) {
    log.error(e);
    return 1;
  }
  // Dependency Injection registration
  const database = new Database(buildDbPath(options.configDir));
  database.migrate();
  await container.register(Database, { useValue: database });
  await container.register(SETTINGS, { useValue: settings });
  await container.register(CONFIG_DIR, { useValue: options.configDir });

  log.debug(() => `IS_COMPILED is initialized as ${IS_COMPILED}`);

  await spawnServer({
    ...options,
    db: database,
    settings,
  });

  await (container as unknown as Disposable).dispose();

  return 0;
}

if (import.meta.main) {
  await main();
}
