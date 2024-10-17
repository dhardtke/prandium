import { log } from "../../deps.ts";

export async function disableLogging() {
    await log.setup({
        loggers: {
            default: {
                handlers: [],
            },
        },
    });
}

type PureLogRecord = Pick<log.LogRecord, "level" | "levelName" | "loggerName" | "msg">;

class CapturingLogHandler extends log.BaseHandler {
    readonly records: PureLogRecord[] = [];

    constructor() {
        super("INFO");
    }

    override handle(logRecord: log.LogRecord) {
        this.records.push({ ...logRecord });
    }

    log(): void {
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
