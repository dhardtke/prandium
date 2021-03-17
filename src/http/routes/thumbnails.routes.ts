import { getThumbnailDir } from "../../data/util/thumbnails.ts";
import { Oak } from "../../deps.ts";

const router: Oak.Router = new Oak.Router();
router.get("/thumbnails/(.+)", async (ctx, next) => {
  try {
    await Oak.send(ctx, ctx.params[0]!, {
      root: getThumbnailDir(ctx.configDir()),
    });
  } catch {
    await next();
  }
});

export { router as ThumbnailsRouter };
