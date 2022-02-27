import { log } from "../../deps.ts";
import { Oak } from "../../deps_oak.ts";
import { Database } from "../data/db.ts";
import { services } from "../data/service/services.ts";
import { Settings } from "../data/settings.ts";
import { DarkModeCookie } from "../shared/constants.ts";
import { Events } from "../tpl/events.ts";
import { Page } from "../tpl/templates/_structure/page.ts";
import { handleNotFound, handleServerError } from "./middleware/error.ts";
import { languageMiddleware } from "./middleware/language.ts";
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
  // Global App State initialize
  services.initialize(args.db);
  Page.minifying = args.settings.minifyHtml;

  const app = new Oak.Application<AppState>({
    state,
    proxy: true,
    logErrors: false,
  });
  app.use(async (ctx, next) => {
    Page.currentUrl = ctx.request.url;
    Page.authorization = ctx.request.headers.get("Authorization");
    Page.dark = await ctx.cookies.get(DarkModeCookie) === "true";
    const event = new Event(Events.PageLoaded);
    globalThis.dispatchEvent(event);
    await next();
  });

  app.use(languageMiddleware);
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
