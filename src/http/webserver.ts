import { Database } from "../data/db.ts";
import { Services, servicesFactory } from "../data/service/services.ts";
import { log, Oak } from "../deps.ts";
import { orderByAdapter } from "./adapters/order_by_adapter.ts";
import { paginationAdapter } from "./adapters/pagination_adapter.ts";
import { parameterAdapter } from "./adapters/parameter_adapter.ts";
import { templateAdapter } from "./adapters/template_adapter.ts";
import { handleNotFound, handleServerError } from "./error.ts";
import { AssetsRouter } from "./routes/assets.routes.ts";
import { BookRouter } from "./routes/book.routes.ts";
import { IndexRouter } from "./routes/index.routes.ts";
import { RecipeRouter } from "./routes/recipe.routes.ts";

const Routers = [
  IndexRouter,
  AssetsRouter,
  RecipeRouter,
  BookRouter,
];

export interface AppState {
  services: Services;
}

function buildState(db: Database): AppState {
  return {
    services: servicesFactory(db),
  };
}

export async function spawnServer(
  args: { host: string; port: number; debug?: boolean; db: Database },
) {
  const state: AppState = buildState(args.db);

  const app = new Oak.Application<AppState>({ state });
  app.use(
    parameterAdapter(),
    orderByAdapter(),
    templateAdapter(args.debug),
    paginationAdapter(),
  );

  app.use(handleServerError);
  for (const router of Routers) {
    app.use(router.routes(), router.allowedMethods());
  }
  app.use(handleNotFound);

  app.addEventListener("listen", ({ hostname, port, secure }) => {
    const protocol = secure ? "https" : "http";
    const url = `${protocol}://${hostname ?? "localhost"}:${port}`;
    log.info(`Server started: Listening on ${url}`);
  });

  await app.listen({ hostname: args.host, port: args.port });
}
