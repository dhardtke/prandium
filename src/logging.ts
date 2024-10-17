import { Colors, log } from "../deps.ts";

export function consoleLogHandlerFactory(): InstanceType<typeof log.BaseHandler> {
    function formatLogRecord(logRecord: log.LogRecord): string {
        const colors: Record<number, (str: string) => string> = {
            [log.LogLevels.NOTSET]: Colors.red,
            [log.LogLevels.DEBUG]: Colors.gray,
            [log.LogLevels.INFO]: Colors.brightBlue,
            [log.LogLevels.WARN]: Colors.yellow,
            [log.LogLevels.ERROR]: Colors.red,
            [log.LogLevels.CRITICAL]: Colors.brightRed,
        };
        const levelName = Object.keys(log.LogLevels).find(levelName => log.LogLevels[levelName as keyof typeof log.LogLevels] === logRecord.level) ?? '';
        const color = colors[logRecord.level];
        return `${color(levelName)} ${logRecord.msg}`;
    }

    return new log.ConsoleHandler("DEBUG", {
        formatter: formatLogRecord,
    });
}

export async function setupLogger(logHandlerFactory: () => InstanceType<typeof log.BaseHandler>, debug?: boolean) {
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
