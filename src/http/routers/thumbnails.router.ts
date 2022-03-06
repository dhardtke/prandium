import { Oak } from "../../../deps-oak.ts";
import { inject, singleton } from "../../../deps.ts";
import { getThumbnailDir } from "../../data/util/thumbnails.ts";
import { CONFIG_DIR } from "../../di.ts";
import { AppState } from "../webserver.ts";
import { Router } from "./router.ts";

@singleton()
export class ThumbnailsRouter extends Router {
  constructor(@inject(CONFIG_DIR) private configDir: string) {
    super();
    this.router.get("/thumbnails/(.+)", this.get);
  }

  get = async (ctx: Oak.RouterContext<"/thumbnails/(.+)", { 0: string }, AppState>, next: () => Promise<unknown>) => {
    try {
      await Oak.send(ctx, ctx.params[0]!, {
        root: getThumbnailDir(this.configDir),
      });
    } catch {
      await next();
    }
  };
}
