import { Oak } from "../../../deps-oak.ts";
import { getThumbnailDir } from "../../data/util/thumbnails.ts";
import { AppState } from "../webserver.ts";
import { Router } from "./router.ts";

export class ThumbnailsRouter extends Router {
  constructor() {
    super();
    this.router.get("/thumbnails/(.+)", this.get);
  }

  get = async (ctx: Oak.RouterContext<"/thumbnails/(.+)", { 0: string }, AppState>, next: () => Promise<unknown>) => {
    try {
      await Oak.send(ctx, ctx.params[0]!, {
        root: getThumbnailDir(ctx.state.configDir),
      });
    } catch {
      await next();
    }
  };
}
