import { Oak } from "../../../deps-oak.ts";
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

export const AssetsRouter = new Oak.Router()
  .get("/assets/(.+)", async (ctx, next) => {
    await assetMiddleware(ctx, next, ctx.params[0]!);
  })
  .get("/sw.js", async (ctx, next) => {
    await assetMiddleware(ctx, next, "sw.js");
  });
