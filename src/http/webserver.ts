import {log, Oak} from "../deps.ts";
import {IndexRouter} from "./routes/index.routes.ts";
import {RecipeRouter} from "./routes/recipe.routes.ts";
import {AssetsRouter} from "./routes/assets.routes.ts";
import {oakAdapter} from "../tpl/mod.ts";

const Routers = [
    IndexRouter,
    AssetsRouter,
    RecipeRouter
];

export async function spawnServer(host: string, port: number) {
    const app = new Oak.Application();
    app.use(oakAdapter());
    for (const router of Routers) {
        app.use(router.routes());
        app.use(router.allowedMethods());
    }

    app.addEventListener("error", (evt) => {
        log.error(evt.error);
    });

    app.addEventListener("listen", ({hostname, port, secure}) => {
        const protocol = secure ? "https" : "http";
        const url = `${protocol}://${hostname ?? "localhost"}:${port}`;
        log.info(`Server started: Listening on ${url}`);
    });

    await app.listen({hostname: host, port: port});
}
