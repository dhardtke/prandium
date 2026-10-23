import { parseArgs } from "node:util";
import { log } from "./logging.ts";
import { type ResultWithErrorCode } from "./shared/types.ts";
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

const DEFAULTS = {
    port: 8000,
    host: "127.0.0.1",
    debug: false,
    configDir: DefaultConfigDir,
    secure: false,
    cert: "",
    key: "",
};
const HELP_TEXT = `
  Usage: COMMAND

  Options:
    --help               - Show help text
    --port=[number]      - the port number                                        (Default: ${DEFAULTS.port})
    --host=[string]      - the host name                                          (Default: "${DEFAULTS.host}")
    --debug=[boolean]    - enable debug mode                                      (Default: ${DEFAULTS.debug})
    --configDir=[string] - The config dir                                         (Default: "${DEFAULTS.configDir}")
    --secure=[boolean]   - enable HTTPS server                                    (Default: ${DEFAULTS.secure})
    --cert=[string]      - path to a certificate file to use for the HTTPS server (Default: "${DEFAULTS.cert}")
    --key=[string]       - path to a key file to use for the HTTPS server         (Default: "${DEFAULTS.key}")
`.trim();

/**
 * Boolean flags may be passed as `--flag` or `--flag=true|false`.
 */
function toBoolean(value: string | boolean | undefined, _default: boolean): boolean {
    if (value === undefined) {
        return _default;
    }
    return typeof value === "boolean" ? value : value !== "false";
}

function toString(value: string | boolean | undefined, _default: string): string {
    return typeof value === "string" ? value : _default;
}

export function parseOptions(args: string[]): ResultWithErrorCode<Options> {
    const { values } = parseArgs({
        args,
        strict: false,
        allowPositionals: true,
        options: {
            help: { type: "boolean" },
            port: { type: "string" },
            host: { type: "string" },
            debug: { type: "boolean" },
            configDir: { type: "string" },
            secure: { type: "boolean" },
            cert: { type: "string" },
            key: { type: "string" },
        },
    });

    if ("help" in values) {
        log.info(HELP_TEXT);
        return 0;
    }

    const port = Number(toString(values.port, String(DEFAULTS.port)));
    const options: Options = {
        host: toString(values.host, DEFAULTS.host),
        port: Number.isNaN(port) ? DEFAULTS.port : port,
        configDir: toString(values.configDir, DEFAULTS.configDir),
        debug: toBoolean(values.debug, DEFAULTS.debug),
        secure: toBoolean(values.secure, DEFAULTS.secure),
        cert: toString(values.cert, DEFAULTS.cert),
        key: toString(values.key, DEFAULTS.key),
    };

    if (options.configDir === DefaultConfigDir) {
        options.configDir = defaultConfigDir();
    }
    return options;
}
