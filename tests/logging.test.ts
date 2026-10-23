import { afterAll, describe, expect, mock, test } from "bun:test";
import { log, LogLevels, setupLogger } from "../src/logging.ts";
import { disableLogging, LogCapture2 } from "./_internal/disable-logging.ts";

describe("logging", () => {
    afterAll(() => {
        disableLogging();
    });

    test("Given debug=false Then debug messages are filtered while info, warn and error messages are logged", () => {
        const capture = new LogCapture2();
        setupLogger(capture.logHandlerFactory, false);

        log.debug("debug");
        log.info("info");
        log.warn("warn");
        log.error("error");

        expect(capture.records).toEqual([
            { msg: "info", level: LogLevels.INFO, levelName: "INFO", loggerName: "default" },
            { msg: "warn", level: LogLevels.WARN, levelName: "WARN", loggerName: "default" },
            { msg: "error", level: LogLevels.ERROR, levelName: "ERROR", loggerName: "default" },
        ]);
    });

    test("Given debug=true Then debug messages are logged", () => {
        const capture = new LogCapture2();
        setupLogger(capture.logHandlerFactory, true);

        log.debug("debug");

        expect(capture.records).toEqual([{ msg: "debug", level: LogLevels.DEBUG, levelName: "DEBUG", loggerName: "default" }]);
    });

    test("Lazy messages are only evaluated if the level is enabled", () => {
        const capture = new LogCapture2();
        setupLogger(capture.logHandlerFactory, false);
        const debugMessage = mock(() => "debug");
        const infoMessage = mock(() => "info");

        log.debug(debugMessage);
        log.info(infoMessage);

        expect(debugMessage).not.toHaveBeenCalled();
        expect(infoMessage).toHaveBeenCalledTimes(1);
        expect(capture.records.map((r) => r.msg)).toEqual(["info"]);
    });

    test("Errors are logged with their stack", () => {
        const capture = new LogCapture2();
        setupLogger(capture.logHandlerFactory, false);
        const error = new Error("boom");

        log.error(error);

        expect(capture.records.map((r) => r.msg)).toEqual([error.stack!]);
    });
});
