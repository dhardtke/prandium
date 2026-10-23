import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { Options, parseOptions } from "../src/options.ts";
import { defaultConfigDir } from "../src/shared/util.ts";
import { disableLogging } from "./_internal/disable-logging.ts";

describe("parseOptions", () => {
    beforeAll(() => {
        disableLogging();
    });

    afterAll(() => {
        disableLogging();
    });

    test("Given no arguments Then the defaults are used", () => {
        expect(parseOptions([])).toEqual({
            host: "127.0.0.1",
            port: 8000,
            configDir: defaultConfigDir(),
            debug: false,
            secure: false,
            cert: "",
            key: "",
        });
    });

    test.each([
        [["--port=9000"]],
        [["--port", "9000"]],
    ])("Given %j Then the port is 9000", (args) => {
        expect((parseOptions(args) as Options).port).toEqual(9000);
    });

    test.each([
        [["--debug"], true],
        [["--debug=true"], true],
        [["--debug=false"], false],
    ])("Given %j Then debug is %p", (args, expected) => {
        expect((parseOptions(args) as Options).debug).toEqual(expected);
    });

    test("Given string options Then they are passed through", () => {
        expect(parseOptions(["--host=0.0.0.0", "--configDir", "/tmp/prandium", "--secure", "--cert=cert.pem", "--key=key.pem"])).toMatchObject({
            host: "0.0.0.0",
            configDir: "/tmp/prandium",
            secure: true,
            cert: "cert.pem",
            key: "key.pem",
        });
    });

    test("Given --help Then 0 is returned", () => {
        expect(parseOptions(["--help"])).toEqual(0);
    });
});
