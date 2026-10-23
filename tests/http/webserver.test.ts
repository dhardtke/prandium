import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { buildRoutes, fallbackHandler, spawnServer } from "../../src/http/webserver.ts";
import { en } from "../../src/i18n/en.ts";
import { setLanguage } from "../../src/i18n/mod.ts";
import { main } from "../../src/main.ts";
import { disableLogging, LogCapture2 } from "../_internal/disable-logging.ts";
import { withTemp } from "../_internal/with-temp.function.ts";

beforeAll(() => {
    disableLogging();
});

afterAll(() => {
    setLanguage(en);
    disableLogging();
});

describe("webserver", () => {
    test("Given a path that no route matches Then the fallback handler responds with the 404 page", async () => {
        const response = await fallbackHandler()(new Request("http://localhost/does-not-exist"));

        expect(response.status).toEqual(404);
        expect(response.headers.get("Content-Type")).toEqual("text/html; charset=utf-8");
    });

    test("buildRoutes wraps every handler with the global middleware", async () => {
        const routes = buildRoutes([{ "/boom": { GET: () => Promise.reject(new Error("boom")) } }]);

        const request = Object.assign(new Request("http://localhost/boom"), { params: {} }) as unknown as Bun.BunRequest;
        const response = await routes["/boom"].GET(request);

        expect(response.status).toEqual(500);
        expect(response.headers.get("Content-Type")).toEqual("text/html; charset=utf-8");
    });

    test(
        "end to end: the server started by main serves pages, assets and the 404 page",
        withTemp(async (configDir) => {
            const abort = new AbortController();
            const listening = Promise.withResolvers<URL>();
            const logCapture = new LogCapture2();

            const exitCode = main({
                args: ["--port=0", `--configDir=${configDir}`],
                serverFactory: (args) => spawnServer({ ...args, signal: abort.signal, onListen: listening.resolve }),
                bunVersion: Bun.version,
                requiredBunVersionRange: ">=1.0.0",
                logHandlerFactory: logCapture.logHandlerFactory,
            });

            try {
                const url = await listening.promise;
                const fetchPath = (path: string, init?: RequestInit) => fetch(new URL(path, url), init);

                const index = await fetchPath("/");
                expect(index.status).toEqual(200);
                expect(index.headers.get("Content-Type")).toEqual("text/html; charset=utf-8");
                expect(await index.text()).toStartWith("<!DOCTYPE html>");

                const create = await fetchPath("/recipe/create");
                expect(create.status).toEqual(200);

                const favicon = await fetchPath("/assets/favicon.svg");
                expect(favicon.status).toEqual(200);
                expect(favicon.headers.get("Content-Type")).toEqual("image/svg+xml");

                const head = await fetchPath("/assets/favicon.svg", { method: "HEAD" });
                expect(head.status).toEqual(200);
                expect(await head.text()).toEqual("");

                const missing = await fetchPath("/does-not-exist");
                expect(missing.status).toEqual(404);
                expect(await missing.text()).toStartWith("<!DOCTYPE html>");

                const unsupportedMethod = await fetchPath("/", { method: "DELETE" });
                expect(unsupportedMethod.status).toEqual(404);

                const missingRecipe = await fetchPath("/recipe/4242/does-not-exist");
                expect(missingRecipe.status).toEqual(404);

                const german = await fetchPath("/?lang=de");
                expect(german.headers.get("Set-Cookie")).toStartWith("PrandiumLanguage=de");
                expect(await german.text()).toContain('<html lang="de"');
            } finally {
                abort.abort();
            }

            expect(await exitCode).toEqual(0);
            expect(logCapture.records.some((r) => r.msg.startsWith("Server started: Listening on http://127.0.0.1:"))).toEqual(true);
        }),
    );
});
