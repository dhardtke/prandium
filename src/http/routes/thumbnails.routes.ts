import { Oak } from "../../../deps.ts";
import { getThumbnailDir } from "../../data/util/thumbnails.ts";
import { AppState } from "../webserver.ts";

const router: Oak.Router = new Oak.Router();
router.get(
  "/thumbnails/(.+)",
  async (ctx: Oak.RouterContext<string, { 0: string }, AppState>, next) => {
    try {
      await Oak.send(ctx, ctx.params[0]!, {
        root: getThumbnailDir(ctx.state.configDir),
      });
    } catch {
      await next();
    }
  },
);

export { router as ThumbnailsRouter };
