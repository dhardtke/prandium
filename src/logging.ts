import { Colors, log, LogRecord } from "../deps.ts";

export function consoleLogHandlerFactory(): InstanceType<typeof log.handlers.BaseHandler> {
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

    return new log.handlers.ConsoleHandler("DEBUG", {
        formatter: formatLogRecord,
    });
}

export async function setupLogger(logHandlerFactory: () => InstanceType<typeof log.handlers.BaseHandler>, debug?: boolean) {
    await log.setup({
        handlers: {
            console: logHandlerFactory(),
        },
        loggers: {
            default: {
                level: debug ? "DEBUG" : "INFO",
                handlers: ["console"],
            },
        },
    });
}
