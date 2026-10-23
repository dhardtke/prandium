import { describe, expect, test } from "bun:test";
import path from "node:path";
import { AssetsRouter } from "../../../src/http/routers/assets.router.ts";
import { toAppRequest } from "../../../src/http/server/request.ts";
import { NotFoundError } from "../../../src/shared/errors.ts";
import { root } from "../../../src/shared/util.ts";

describe("AssetsRouter", () => {
    const assetsDir = root("assets");

    test("getAsset throws a NotFoundError if the asset does not exist", async () => {
        const req = toAppRequest(new Request("http://localhost/assets/does-not-exist.svg"));

        await expect(new AssetsRouter().getAsset(req)).rejects.toThrow(NotFoundError);
    });

    test("getAsset returns the contents of favicon.svg", async () => {
        const req = toAppRequest(new Request("http://localhost/assets/favicon.svg"));

        const response = await new AssetsRouter().getAsset(req);

        const sourceData = await Bun.file(path.join(assetsDir, "favicon.svg")).text();
        expect(response.status).toEqual(200);
        expect(response.headers.get("Content-Type")).toEqual("image/svg+xml");
        expect(await response.text()).toEqual(sourceData);
    });

    test("/sw.js returns the contents of sw.js", async () => {
        const req = toAppRequest(new Request("http://localhost/sw.js"));

        const response = await new AssetsRouter().getSw(req);

        const sourceData = await Bun.file(path.join(assetsDir, "sw.js")).text();
        expect(await response.text()).toEqual(sourceData);
    });

    test("routes registers GET /assets/* and GET /sw.js", () => {
        const routes = new AssetsRouter().routes();

        expect(Object.keys(routes)).toEqual(["/assets/*", "/sw.js"]);
        expect(Object.keys(routes["/assets/*"])).toEqual(["GET"]);
        expect(Object.keys(routes["/sw.js"])).toEqual(["GET"]);
    });
});
