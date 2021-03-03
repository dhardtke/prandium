import {log, Oak, path} from "../deps.ts";
import {IndexTemplate, RecipeTemplate} from "../tpl/mod.ts";

const COMPILED_ASSETS_DIR = path.resolve(Deno.cwd(), "assets", "dist");

export async function spawnServer(dev: boolean, host: string, port: number) {
    const router = new Oak.Router();
    // TODO make syntax easier, see template wrapper
    router
        .get("/", async (ctx) => {
            ctx.response.body = await IndexTemplate.render({favoriteCake: "Bla"});
        })
        .get("/assets/:name", async (ctx) => {
            if (ctx.params?.name) {
                await Oak.send(ctx, ctx.params.name, {
                    root: COMPILED_ASSETS_DIR
                });
            }
        })
        .get("/recipe/:id", async (ctx) => {
            ctx.response.body = await RecipeTemplate.render();
        });

    const app = new Oak.Application();
    app.use(router.routes());
    app.use(router.allowedMethods());

    app.addEventListener("error", (evt) => {
        log.error(evt.error);
    });

    await app.listen({hostname: host, port: port});
}
