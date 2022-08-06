import { assertEquals } from "../../../deps-test.ts";
import { Oak, path } from "../../../deps.ts";
import { AssetsRouter, GET_ROUTE, SW_JS_ROUTE } from "../../../src/http/routers/assets.router.ts";
import { root } from "../../../src/shared/util.ts";

Deno.test("AssetsRouter", async (t) => {
    const assetsDir = root("assets");

    await t.step("get invokes next middleware if an error is thrown", async () => {
        const ctx = Oak.testing.createMockContext<typeof GET_ROUTE>({ method: "GET", path: "/" });
        let invocationCount = 0;
        const next: () => Promise<unknown> = () => {
            invocationCount++;
            return Promise.resolve();
        };
        // param[0] is missing => error
        await new AssetsRouter().get(ctx, next);
        assertEquals(invocationCount, 1);
    });

    await t.step("get returns the contents of favicon.svg and does not invoke next middleware", async () => {
        let called = false;
        const ctx = Oak.testing.createMockContext<typeof GET_ROUTE>({ method: "GET", path: "/", params: { 0: "favicon.svg" } });
        const next: () => Promise<unknown> = () => {
            called = true;
            return Promise.resolve();
        };

        await new AssetsRouter().get(ctx, next);

        const sourceData = Deno.readTextFileSync(path.join(assetsDir, "favicon.svg"));
        const responseBody = ctx.response.body as Uint8Array;
        assertEquals(new TextDecoder().decode(responseBody), sourceData);
        assertEquals(called, false);
    });

    await t.step("/sw.js returns the contents of sw.js", async () => {
        const ctx = Oak.testing.createMockContext<typeof SW_JS_ROUTE>({ method: "GET", path: "/" });
        const next = Oak.testing.createMockNext();

        await new AssetsRouter().getSw(ctx, next);

        const sourceData = Deno.readTextFileSync(path.join(assetsDir, "sw.js"));
        const responseBody = ctx.response.body as Uint8Array;
        assertEquals(new TextDecoder().decode(responseBody), sourceData);
    });
});
