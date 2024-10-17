import { needle, Oak } from "../../../deps.ts";
import { getThumbnailDir } from "../../data/util/thumbnails.ts";
import { CONFIG_DIR } from "../../di.ts";
import { Router } from "./router.ts";

@needle.injectable()
export class ThumbnailsRouter extends Router {
    constructor(
        private configDir: string = needle.inject(CONFIG_DIR),
    ) {
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
