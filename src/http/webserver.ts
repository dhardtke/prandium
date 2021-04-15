import { HttpServerStd, log, Oak } from "../../deps.ts";
import { Database } from "../data/db.ts";
import { services } from "../data/service/services.ts";
import { Settings } from "../settings.ts";
import { orderByAdapter } from "./adapters/order_by_adapter.ts";
import { paginationAdapter } from "./adapters/pagination_adapter.ts";
import { parameterAdapter } from "./adapters/parameter_adapter.ts";
import { templateAdapter } from "./adapters/template_adapter.ts";
import { handleNotFound, handleServerError } from "./error.ts";
import { Routers } from "./routes/routers.ts";

export interface AppState {
  settings: Settings;
  configDir: string;
}

function buildState(
  args: { settings: Settings; configDir: string },
): AppState {
  return { ...args };
}

export async function spawnServer(
  args: {
    host: string;
    port: number;
    debug?: boolean;
    secure?: boolean;
    key?: string;
    cert?: string;
    configDir: string;
    db: Database;
    settings: Settings;
  },
) {
  const state: AppState = buildState({
    settings: args.settings,
    configDir: args.configDir,
  });
  services.initialize(args.db);

  // TODO remove explicit HttpServerStd instantiation once https://github.com/denoland/deno/issues/10193 is fixed
  const app = new Oak.Application<AppState>({
    state,
    serverConstructor: HttpServerStd,
  });
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

  const sslOptions = args.secure
    ? {
      secure: true,
      certFile: args.cert || "",
      keyFile: args.key || "",
    }
    : {};
  await app.listen({
    hostname: args.host,
    port: args.port,
    ...sslOptions,
  });
}
