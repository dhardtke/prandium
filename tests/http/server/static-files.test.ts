import { beforeAll, describe, expect, test } from "bun:test";
import { mkdtemp } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { toAppRequest } from "../../../src/http/server/request.ts";
import { serveFile } from "../../../src/http/server/static-files.ts";

describe("serveFile", () => {
    let root: string;

    beforeAll(async () => {
        const tmpDir = await mkdtemp(path.join(os.tmpdir(), "prandium-"));
        root = path.join(tmpDir, "public");
        await Bun.write(path.join(root, "index.js"), "console.log('plain');");
        await Bun.write(path.join(root, "index.js.br"), "brotli");
        await Bun.write(path.join(root, "index.js.gz"), "gzip");
        await Bun.write(path.join(root, "Gemüse Reis.txt"), "umlauts");
        await Bun.write(path.join(root, ".secret"), "hidden");
        await Bun.write(path.join(tmpDir, "outside.txt"), "outside");
    });

    function request(pathname: string, headers: HeadersInit = {}, method = "GET") {
        return toAppRequest(new Request(`http://localhost${pathname}`, { headers, method }));
    }

    test("serves the file with its content type and caching headers", async () => {
        const response = (await serveFile(request("/index.js"), root, "index.js"))!;

        expect(response.status).toEqual(200);
        expect(await response.text()).toEqual("console.log('plain');");
        expect(response.headers.get("Content-Type")).toStartWith("text/javascript");
        expect(response.headers.get("Content-Encoding")).toBeNull();
        expect(response.headers.get("Vary")).toEqual("Accept-Encoding");
        expect(response.headers.get("ETag")).toStartWith('W/"');
        expect(response.headers.get("Last-Modified")).not.toBeNull();
    });

    test("decodes URL-encoded file names", async () => {
        const response = (await serveFile(request("/Gem%C3%BCse%20Reis.txt"), root, "Gem%C3%BCse%20Reis.txt"))!;

        expect(await response.text()).toEqual("umlauts");
    });

    test.each([["../outside.txt"], ["..%2Foutside.txt"], ["%2E%2E/outside.txt"], [".secret"], ["does-not-exist.js"], [""], ["%E0%A4%A"]])(
        "does not serve %s",
        async (relativePath) => {
            expect(await serveFile(request(`/${relativePath}`), root, relativePath)).toBeUndefined();
        },
    );

    test("serves the brotli variant with Content-Encoding and the original Content-Type if accepted", async () => {
        const response = (await serveFile(request("/index.js", { "Accept-Encoding": "gzip, deflate, br" }), root, "index.js"))!;

        expect(await response.text()).toEqual("brotli");
        expect(response.headers.get("Content-Encoding")).toEqual("br");
        expect(response.headers.get("Content-Type")).toStartWith("text/javascript");
    });

    test("serves the gzip variant if brotli is not accepted", async () => {
        const response = (await serveFile(request("/index.js", { "Accept-Encoding": "gzip, br;q=0" }), root, "index.js"))!;

        expect(await response.text()).toEqual("gzip");
        expect(response.headers.get("Content-Encoding")).toEqual("gzip");
        expect(response.headers.get("Content-Type")).toStartWith("text/javascript");
    });

    test("responds with 304 if If-None-Match matches the ETag", async () => {
        const first = (await serveFile(request("/index.js"), root, "index.js"))!;
        const etag = first.headers.get("ETag")!;

        const response = (await serveFile(request("/index.js", { "If-None-Match": etag }), root, "index.js"))!;

        expect(response.status).toEqual(304);
        expect(await response.text()).toEqual("");
    });

    test("responds to HEAD requests without a body", async () => {
        const response = (await serveFile(request("/index.js", {}, "HEAD"), root, "index.js"))!;

        expect(response.status).toEqual(200);
        expect(response.headers.get("Content-Length")).toEqual(String("console.log('plain');".length));
        expect(await response.text()).toEqual("");
    });
});
