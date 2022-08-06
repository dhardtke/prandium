import { log, LogRecord } from "../../deps.ts";

export async function disableLogging() {
    await log.setup({
        loggers: {
            default: {
                handlers: [],
            },
        },
    });
}

type PureLogRecord = Pick<LogRecord, "level" | "levelName" | "loggerName" | "msg">;

class CapturingLogHandler extends log.handlers.BaseHandler {
    readonly records: PureLogRecord[] = [];

    constructor() {
        super("INFO");
    }

    handle(logRecord: LogRecord) {
        this.records.push({ ...logRecord });
    }
}

export class LogCapture2 {
    private handler = new CapturingLogHandler();

    public get records(): PureLogRecord[] {
        return this.handler.records;
    }

    public logHandlerFactory = () => this.handler;
}
