import { describe, expect, test } from "bun:test";
import { compose } from "../../../src/http/server/compose.ts";
import { toAppRequest } from "../../../src/http/server/request.ts";
import { Middleware } from "../../../src/http/server/types.ts";

describe("compose", () => {
    const req = toAppRequest(new Request("http://localhost/"));

    test("middlewares are invoked in order around the handler", async () => {
        const calls: string[] = [];
        const middleware =
            (name: string): Middleware =>
            async (_req, next) => {
                calls.push(`${name} before`);
                const response = await next();
                calls.push(`${name} after`);
                return response;
            };

        const response = await compose([middleware("first"), middleware("second")], () => {
            calls.push("handler");
            return new Response("handler");
        })(req);

        expect(await response.text()).toEqual("handler");
        expect(calls).toEqual(["first before", "second before", "handler", "second after", "first after"]);
    });

    test("a middleware can short-circuit by not calling next", async () => {
        let handlerCalled = false;

        const response = await compose([() => Promise.resolve(new Response("short-circuit"))], () => {
            handlerCalled = true;
            return new Response("handler");
        })(req);

        expect(await response.text()).toEqual("short-circuit");
        expect(handlerCalled).toEqual(false);
    });

    test("errors thrown synchronously by the handler can be caught by a middleware", async () => {
        const catching: Middleware = async (_req, next) => {
            try {
                return await next();
            } catch (e) {
                return new Response((e as Error).message, { status: 500 });
            }
        };

        const response = await compose([catching], () => {
            throw new Error("boom");
        })(req);

        expect(response.status).toEqual(500);
        expect(await response.text()).toEqual("boom");
    });

    test("without middlewares the handler is invoked directly", async () => {
        const response = await compose([], () => new Response("handler"))(req);

        expect(await response.text()).toEqual("handler");
    });
});
