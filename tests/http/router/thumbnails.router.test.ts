import { assertEquals } from "../../../deps-test.ts";
import { Oak, fs, path } from "../../../deps.ts";
import { ThumbnailsRouter } from "../../../src/http/routers/thumbnails.router.ts";
import { AppState } from "../../../src/http/webserver.ts";
import { root } from "../../../src/shared/util.ts";
import { withTemp } from "../../_internal/with-temp.function.ts";

Deno.test("ThumbnailsRouter", async (t) => {
  await t.step(
    "get invokes next middleware if an error is thrown",
    withTemp(async (tmpDir) => {
      const ctx = Oak.testing.createMockContext<"/thumbnails/(.+)", { 0: string }>({ method: "GET", path: "/" });
      let invocationCount = 0;
      const next: () => Promise<unknown> = () => {
        invocationCount++;
        return Promise.resolve();
      };
      // param[0] is missing => error
      await new ThumbnailsRouter(tmpDir).get(ctx, next);
      assertEquals(invocationCount, 1);
    }),
  );

  await t.step(
    "get returns the thumbnail image data",
    withTemp(async (tmpDir) => {
      const thumbnailDir = path.join(tmpDir, "thumbnails");
      await fs.ensureDir(thumbnailDir);
      const sourceImage = root("tests", "http", "router", "1x1.png");
      fs.copySync(sourceImage, path.join(thumbnailDir, "1x1.png"));

      const ctx = Oak.testing.createMockContext<"/thumbnails/(.+)", { 0: string }, AppState>({ method: "GET", path: "/", params: { 0: "1x1.png" } });
      const next = Oak.testing.createMockNext();

      await new ThumbnailsRouter(tmpDir).get(ctx, next);

      const sourceData = Deno.readFileSync(sourceImage);
      assertEquals(ctx.response.body, sourceData);
    }),
  );
});
