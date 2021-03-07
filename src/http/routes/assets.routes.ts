import {Oak, path} from "../../deps.ts";

const COMPILED_ASSETS_DIR = path.resolve(Deno.cwd(), "assets", "dist");

const router: Oak.Router = new Oak.Router();
router.get("/assets/:name", async (ctx) => {
    if (ctx.params?.name) {
        await Oak.send(ctx, ctx.params.name, {
            root: COMPILED_ASSETS_DIR
        });
    }
})

export {router as AssetsRouter};
