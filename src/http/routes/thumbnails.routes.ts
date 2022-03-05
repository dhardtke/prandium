import { Oak } from "../../../deps_oak.ts";
import { getThumbnailDir } from "../../data/util/thumbnails.ts";
import { AppState } from "../webserver.ts";

export const ThumbnailsRouter = new Oak.Router()
  .get(
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
