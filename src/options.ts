import { flags, log } from "../deps.ts";
import { ResultWithErrorCode } from "./main.ts";
import { DefaultConfigDir, defaultConfigDir } from "./shared/util.ts";

export interface Options {
  host: string;
  port: number;
  configDir: string;
  debug?: boolean;
  /** @deprecated */
  secure?: boolean;
  cert?: string;
  key?: string;
}

const PARSE_OPTIONS: flags.ParseOptions = {
  boolean: [
    "secure",
    "debug",
  ],
  default: {
    port: 8000,
    host: "127.0.0.1",
    debug: false,
    configDir: DefaultConfigDir,
    secure: false,
    cert: "",
    key: "",
  },
};
const HELP_TEXT = `
  Usage: COMMAND

  Options:
    --help               - Show help text
    --port=[number]      - the port number                                        (Default: ${PARSE_OPTIONS.default!.port})
    --host=[string]      - the host name                                          (Default: "${PARSE_OPTIONS.default!.host}")
    --debug=[boolean]    - enable debug mode                                      (Default: ${PARSE_OPTIONS.default!.debug})
    --configDir=[string] - The config dir                                         (Default: "${PARSE_OPTIONS.default!.configDir}")
    --secure=[boolean]   - enable HTTPS server                                    (Default: ${PARSE_OPTIONS.default!.secure})
    --cert=[string]      - path to a certificate file to use for the HTTPS server (Default: "${PARSE_OPTIONS.default!.cert}")
    --key=[string]       - path to a key file to use for the HTTPS server         (Default: "${PARSE_OPTIONS.default!.key}")
`.trim();

export function parseOptions(args: string[]): ResultWithErrorCode<Options> {
  const options = flags.parse(args, PARSE_OPTIONS) as unknown as Options;

  if ("help" in options) {
    log.info(HELP_TEXT);
    return 0;
  }

  if (options.configDir === DefaultConfigDir) {
    options.configDir = defaultConfigDir();
  }
  return options;
}
