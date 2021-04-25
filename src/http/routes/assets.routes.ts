import { Oak } from "../../../deps.ts";
import { root } from "../../util.ts";

const CompiledAssetsDir = root("assets");

const router: Oak.Router = new Oak.Router();
router.get("/assets/(.+)", async (ctx, next) => {
  try {
    await Oak.send(ctx, ctx.params[0]!, {
      root: CompiledAssetsDir,
    });
  } catch {
    await next();
  }
});

export { router as AssetsRouter };
