import { Oak } from "../../../deps_oak.ts";
import { root } from "../../shared/util.ts";

const CompiledAssetsDir = root("assets");

async function assetMiddleware<P extends string>(
  ctx: Oak.RouterContext<P>,
  next: () => Promise<unknown>,
  filename: string,
) {
  try {
    await Oak.send(ctx, filename, {
      root: CompiledAssetsDir,
    });
  } catch {
    await next();
  }
}

const router: Oak.Router = new Oak.Router();
router.get("/assets/(.+)", async (ctx, next) => {
  await assetMiddleware(ctx, next, ctx.params[0]!);
});
router.get("/sw.js", async (ctx, next) => {
  await assetMiddleware(ctx, next, "sw.js");
});

export { router as AssetsRouter };
