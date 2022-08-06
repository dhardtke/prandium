import { assertEquals } from "../deps-test.ts";
import { log } from "../deps.ts";
import { denoVersionIsSatified, main } from "../src/main.ts";
import { LogCapture2 } from "./_internal/disable-logging.ts";

Deno.test("main", async (t) => {
    const logCapture = new LogCapture2();

    await t.step("denoVersionIsSatified", async (t) => {
        const tests = [
            ["1.0.0", "~1.0.0", true],
            ["2.0.0", "~1.0.0", false],
            ["1.1.0", "~1.0.0", false],
            ["1.0.1", "~1.0.0", true],
            ["1.0.0", ">1.0.0", false],
            ["1.1.0", ">1.0.0", true],
            ["2.0.0", ">1.0.0", true],
            ["1.5.2", "^1.0.0", true],
            ["2.0.0", "^1.0.0", false],
        ];
        for (const [denoVersion, requiredVersionRange, expected] of tests) {
            await t.step(`when called with denoVersion="${denoVersion}", requiredVersionRange="${requiredVersionRange}" should return ${expected}`, () => {
                assertEquals(denoVersionIsSatified(denoVersion as string, requiredVersionRange as string), expected);
            });
        }
    });

    await t.step("should return error code 1 if the version of Deno does not satisfy the required version range", async () => {
        assertEquals(
            await main({
                args: [],
                serverFactory: async () => {
                },
                denoVersion: "42.0.0",
                requiredDenoVersionRange: "~1.22.0",
                logHandlerFactory: logCapture.logHandlerFactory,
            }),
            1,
        );
        assertEquals(logCapture.records, [
            {
                msg: "The installed version of Deno does not satisfy the required version range ~1.24.0. Please install a compatible Deno version and try again.",
                level: log.LogLevels.ERROR,
                levelName: "ERROR",
                loggerName: "default",
            },
        ]);
    });
});
