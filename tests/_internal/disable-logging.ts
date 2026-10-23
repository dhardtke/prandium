import { BaseHandler, disableLogger, LogRecord } from "../../src/logging.ts";

export function disableLogging() {
    disableLogger();
}

type PureLogRecord = Pick<LogRecord, "level" | "levelName" | "loggerName" | "msg">;

class CapturingLogHandler extends BaseHandler {
    readonly records: PureLogRecord[] = [];

    constructor() {
        super("INFO");
    }

    override handle(logRecord: LogRecord) {
        this.records.push({ ...logRecord });
    }

    override log(): void {
        // no-op
    }
}

export class LogCapture2 {
    private handler = new CapturingLogHandler();

    public get records(): PureLogRecord[] {
        return this.handler.records;
    }

    public logHandlerFactory = () => this.handler;
}
