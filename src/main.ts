import { container, fs, log, path, satisfies } from "../deps.ts";
import { Database } from "./data/db.ts";
import { Argparser } from "./data/parse/argparser.ts";
import { readFromDisk, Settings } from "./data/settings.ts";
import { buildDbPath } from "./data/util/build-db-path.ts";
import { CONFIG_DIR, SETTINGS } from "./di.ts";
import { spawnServer } from "./http/webserver.ts";
import { consoleLogHandlerFactory, setupLogger } from "./logging.ts";
import { DefaultConfigDir, defaultConfigDir, IS_COMPILED } from "./shared/util.ts";
import { shouldPrettifyTemplates } from "./tpl/util/render.ts";

const REQUIRED_DENO_VERSION_RANGE = "~1.22.0";

interface Options {
  host: string;
  port: number;
  configDir: string;
  debug?: boolean; /** @deprecated */
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

export function denoVersionIsSatified(denoVersion = Deno.version.deno, requiredVersionRange = REQUIRED_DENO_VERSION_RANGE): boolean {
  return satisfies(denoVersion, requiredVersionRange);
}

type ResultWithErrorCode<T> = T | 0 | 1;

export function parseOptions(args: string[]): ResultWithErrorCode<Options> {
  try {
    const options = argparser.parse(args);

    if ("help" in options) {
      log.info(argparser.help());
      return 0;
    }

    if (options.configDir === DefaultConfigDir) {
      options.configDir = defaultConfigDir();
    }
    return options;
  } catch (e) {
    log.error(e.message);
    log.info(argparser.help());
    return 1;
  }
}

export async function readSettings(configDir: string): Promise<ResultWithErrorCode<Settings>> {
  try {
    return await readFromDisk(configDir);
  } catch (e) {
    log.error(e);
    return 1;
  }
}

export interface BootData {
  args: string[];
  serverFactory: (args: {
    host: string;
    port: number;
    debug?: boolean;
    secure?: boolean;
    key?: string;
    cert?: string;
    configDir: string;
    db: Database;
    settings: Settings;
  }) => Promise<void>;
  denoVersion: string;
  requiredDenoVersionRange: string;
  logHandlerFactory: () => InstanceType<typeof log.handlers.BaseHandler>;
}

export async function main(bootData: BootData = {
  args: Deno.args,
  serverFactory: spawnServer,
  denoVersion: Deno.version.deno,
  requiredDenoVersionRange: REQUIRED_DENO_VERSION_RANGE,
  logHandlerFactory: consoleLogHandlerFactory,
}): Promise<number> {
  const options = parseOptions(bootData.args) as Options;
  if (typeof options === "number") {
    return options;
  }
  await setupLogger(bootData.logHandlerFactory, options.debug);
  if (!denoVersionIsSatified(bootData.denoVersion, bootData.requiredDenoVersionRange)) {
    log.error(
      `The installed version of Deno does not satisfy the required version range ${REQUIRED_DENO_VERSION_RANGE}.` +
        ` Please install a compatible Deno version and try again.`,
    );
    return 1;
  }
  await prepareConfigDir(options);
  shouldPrettifyTemplates(Boolean(options.debug));

  const settings = await readSettings(options.configDir) as Settings;
  if (typeof settings === "number") {
    return settings;
  }
  // Dependency Injection registration
  const database = new Database(buildDbPath(options.configDir));
  await container.register(Database, { useValue: database });
  await container.register(SETTINGS, { useValue: settings });
  await container.register(CONFIG_DIR, { useValue: options.configDir });
  database.migrate();

  log.debug(() => `IS_COMPILED is initialized as ${IS_COMPILED}`);

  await bootData.serverFactory({
    ...options,
    db: database,
    settings,
  });
  await database.dispose(); // FIXME remove this line when database is disposed by disposing of the container.
  // Right now it doesn't work because Database is constructed manually
  await container.dispose();
  return 0;
}

if (import.meta.main) {
  await main();
}
