import { brightBlue, brightRed, gray, red, yellow } from "./shared/colors.ts";

export const LogLevels = {
    NOTSET: 0,
    DEBUG: 10,
    INFO: 20,
    WARN: 30,
    ERROR: 40,
    CRITICAL: 50,
} as const;

export type LevelName = keyof typeof LogLevels;
export type LogLevel = (typeof LogLevels)[LevelName];

function getLevelName(level: number): LevelName {
    return (Object.keys(LogLevels) as LevelName[]).find((levelName) => LogLevels[levelName] === level) ?? "NOTSET";
}

export class LogRecord {
    readonly msg: string;
    readonly level: number;
    readonly levelName: string;
    readonly loggerName: string;
    readonly #args: unknown[];

    constructor(options: { msg: string; args: unknown[]; level: number; loggerName: string }) {
        this.msg = options.msg;
        this.#args = [...options.args];
        this.level = options.level;
        this.levelName = getLevelName(options.level);
        this.loggerName = options.loggerName;
    }

    get args(): unknown[] {
        return [...this.#args];
    }
}

export type FormatterFunction = (logRecord: LogRecord) => string;

export class BaseHandler {
    readonly level: number;
    readonly formatter: FormatterFunction;

    constructor(levelName: LevelName, options: { formatter?: FormatterFunction } = {}) {
        this.level = LogLevels[levelName];
        this.formatter = options.formatter ?? ((logRecord) => `${logRecord.levelName} ${logRecord.msg}`);
    }

    handle(logRecord: LogRecord): void {
        if (this.level > logRecord.level) {
            return;
        }
        this.log(this.format(logRecord));
    }

    format(logRecord: LogRecord): string {
        return this.formatter(logRecord);
    }

    log(_msg: string): void {
        // to be implemented by subclasses
    }
}

export class ConsoleHandler extends BaseHandler {
    override log(msg: string): void {
        console.log(msg);
    }
}

/** A message: a string, an Error (logged with its stack), a function returning the message (evaluated lazily) or any other value. */
export type LogMessage = unknown;

function asString(data: unknown): string {
    if (typeof data === "string") {
        return data;
    }
    if (data instanceof Error) {
        return data.stack ?? String(data);
    }
    if (data !== null && typeof data === "object") {
        return JSON.stringify(data);
    }
    return String(data);
}

class Logger {
    level: number = LogLevels.INFO;
    handlers: BaseHandler[] = [];

    constructor(readonly name: string) {
    }

    private log(level: number, msg: LogMessage, args: unknown[]): void {
        if (this.level > level) {
            return;
        }
        const resolved = typeof msg === "function" ? msg() : msg;
        const record = new LogRecord({ msg: asString(resolved), args, level, loggerName: this.name });
        for (const handler of this.handlers) {
            handler.handle(record);
        }
    }

    debug(msg: LogMessage, ...args: unknown[]): void {
        this.log(LogLevels.DEBUG, msg, args);
    }

    info(msg: LogMessage, ...args: unknown[]): void {
        this.log(LogLevels.INFO, msg, args);
    }

    warn(msg: LogMessage, ...args: unknown[]): void {
        this.log(LogLevels.WARN, msg, args);
    }

    error(msg: LogMessage, ...args: unknown[]): void {
        this.log(LogLevels.ERROR, msg, args);
    }

    critical(msg: LogMessage, ...args: unknown[]): void {
        this.log(LogLevels.CRITICAL, msg, args);
    }
}

export function consoleLogHandlerFactory(): BaseHandler {
    function formatLogRecord(logRecord: LogRecord): string {
        const colors: Record<number, (str: string) => string> = {
            [LogLevels.NOTSET]: red,
            [LogLevels.DEBUG]: gray,
            [LogLevels.INFO]: brightBlue,
            [LogLevels.WARN]: yellow,
            [LogLevels.ERROR]: red,
            [LogLevels.CRITICAL]: brightRed,
        };
        const color = colors[logRecord.level] ?? red;
        return `${color(logRecord.levelName)} ${logRecord.msg}`;
    }

    return new ConsoleHandler("DEBUG", {
        formatter: formatLogRecord,
    });
}

/**
 * The application logger. Until {@link setupLogger} is called, messages of level INFO and above are printed to the console.
 */
export const log = new Logger("default");
log.handlers = [consoleLogHandlerFactory()];

export function setupLogger(logHandlerFactory: () => BaseHandler, debug?: boolean) {
    log.level = debug ? LogLevels.DEBUG : LogLevels.INFO;
    log.handlers = [logHandlerFactory()];
}

/**
 * Removes all log handlers, i.e. nothing is logged anymore until {@link setupLogger} is called again.
 */
export function disableLogger() {
    log.handlers = [];
}
