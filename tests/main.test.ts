import { afterAll, describe, expect, test } from "bun:test";
import { LogLevels } from "../src/logging.ts";
import { bunVersionIsSatisfied, main, REQUIRED_BUN_VERSION_RANGE } from "../src/main.ts";
import { disableLogging, LogCapture2 } from "./_internal/disable-logging.ts";

describe("main", () => {
    afterAll(() => {
        disableLogging();
    });

    describe("bunVersionIsSatisfied", () => {
        test.each([
            ["1.0.0", "~1.0.0", true],
            ["2.0.0", "~1.0.0", false],
            ["1.1.0", "~1.0.0", false],
            ["1.0.1", "~1.0.0", true],
            ["1.0.0", ">1.0.0", false],
            ["1.1.0", ">1.0.0", true],
            ["2.0.0", ">1.0.0", true],
            ["1.5.2", "^1.0.0", true],
            ["2.0.0", "^1.0.0", false],
            ["1.4.3", ">=1.4.4", false],
            ["1.4.4", ">=1.4.4", true],
        ])(`when called with version="%s", range="%s" should return %p`, (version, range, expected) => {
            expect(bunVersionIsSatisfied(version, range)).toEqual(expected);
        });

        test("the running Bun version satisfies the required version range", () => {
            expect(bunVersionIsSatisfied()).toEqual(true);
        });
    });

    test("should return error code 1 if the version of Bun does not satisfy the required version range", async () => {
        const logCapture = new LogCapture2();
        expect(
            await main({
                args: [],
                serverFactory: async () => {},
                bunVersion: "42.0.0",
                requiredBunVersionRange: "~1.22.0",
                logHandlerFactory: logCapture.logHandlerFactory,
            }),
        ).toEqual(1);
        expect(logCapture.records).toEqual([
            {
                msg:
                    `The installed version of Bun does not satisfy the required version range ${REQUIRED_BUN_VERSION_RANGE}.` +
                    ` Please install a compatible Bun version and try again.`,
                level: LogLevels.ERROR,
                levelName: "ERROR",
                loggerName: "default",
            },
        ]);
    });
});
