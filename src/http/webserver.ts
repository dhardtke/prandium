import {log, Oak} from "../deps.ts";
import {IndexRouter} from "./routes/index.routes.ts";
import {RecipeRouter} from "./routes/recipe.routes.ts";
import {AssetsRouter} from "./routes/assets.routes.ts";
import {Database} from "../data/db.ts";
import {Services} from "../data/service/services.ts";
import {RecipeService} from "../data/service/RecipeService.ts";
import {templateAdapter} from "./adapters/template_adapter.ts";
import {paginationAdapter} from "./adapters/pagination_adapter.ts";
import {queryAdapter} from "./adapters/query_adapter.ts";

const Routers = [
    IndexRouter,
    AssetsRouter,
    RecipeRouter
];

export interface AppState {
    services: Services;
}

function buildState(db: Database): AppState {
    return {
        services: {
            // TODO move this to generic factory method
            RecipeService: new RecipeService(db)
        }
    };
}

export async function spawnServer(args: { host: string, port: number, debug?: boolean, db: Database }) {
    const state: AppState = buildState(args.db);

    const app = new Oak.Application<AppState>({state});
    app.use(queryAdapter(), templateAdapter(args.debug), paginationAdapter());

    for (const router of Routers) {
        app.use(router.routes(), router.allowedMethods());
    }

    app.addEventListener("error", (evt) => {
        log.error(evt.error);
    });
    app.addEventListener("listen", ({hostname, port, secure}) => {
        const protocol = secure ? "https" : "http";
        const url = `${protocol}://${hostname ?? "localhost"}:${port}`;
        log.info(`Server started: Listening on ${url}`);
    });

    await app.listen({hostname: args.host, port: args.port});
}
