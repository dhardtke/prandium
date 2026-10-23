import { describe, expect, test } from "bun:test";
import { copyFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { ThumbnailsRouter } from "../../../src/http/routers/thumbnails.router.ts";
import { toAppRequest } from "../../../src/http/server/request.ts";
import { NotFoundError } from "../../../src/shared/errors.ts";
import { root } from "../../../src/shared/util.ts";
import { withTemp } from "../../_internal/with-temp.function.ts";

describe("ThumbnailsRouter", () => {
    test(
        "getThumbnail throws a NotFoundError if the thumbnail does not exist",
        withTemp(async (tmpDir) => {
            const req = toAppRequest(new Request("http://localhost/thumbnails/does-not-exist.png"));

            await expect(new ThumbnailsRouter(tmpDir).getThumbnail(req)).rejects.toThrow(NotFoundError);
        }),
    );

    test(
        "getThumbnail returns the thumbnail image data",
        withTemp(async (tmpDir) => {
            const thumbnailDir = path.join(tmpDir, "thumbnails");
            await mkdir(thumbnailDir, { recursive: true });
            const sourceImage = root("tests", "http", "router", "1x1.png");
            await copyFile(sourceImage, path.join(thumbnailDir, "1x1.png"));

            const req = toAppRequest(new Request("http://localhost/thumbnails/1x1.png"));
            const response = await new ThumbnailsRouter(tmpDir).getThumbnail(req);

            expect(response.headers.get("Content-Type")).toEqual("image/png");
            expect(new Uint8Array(await response.arrayBuffer())).toEqual(await Bun.file(sourceImage).bytes());
        }),
    );
});
