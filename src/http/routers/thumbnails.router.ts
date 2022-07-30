import { inject, Oak, singleton } from "../../../deps.ts";
import { getThumbnailDir } from "../../data/util/thumbnails.ts";
import { CONFIG_DIR } from "../../di.ts";
import { Router } from "./router.ts";

@singleton()
export class ThumbnailsRouter extends Router {
    constructor(@inject(CONFIG_DIR) private configDir: string) {
        super();
        this.router.get("/thumbnails/(.+)", this.get);
    }

    get: Oak.RouterMiddleware<"/thumbnails/(.+)", { 0: string }> = async (ctx, next) => {
        try {
            await Oak.send(ctx, ctx.params[0]!, {
                root: getThumbnailDir(this.configDir),
            });
        } catch {
            await next();
        }
    };
}
