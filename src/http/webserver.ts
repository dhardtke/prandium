import { log, Oak } from "../../deps.ts";
import { Database } from "../data/db.ts";
import { Settings } from "../data/settings.ts";
import { DarkModeCookie } from "../shared/constants.ts";
import { Page } from "../tpl/templates/_structure/page.tsx";
import { handleNotFound, handleServerError } from "./middleware/error.ts";
import { languageMiddleware } from "./middleware/language.ts";
import { RouterRegistry } from "./routers/router-registry.ts";
import { currentUrl } from "./middleware/helpers/current-url.ts";

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

    const app = new Oak.Application<AppState>({
        state,
        proxy: true,
        logErrors: false,
    });
    app.use(async (ctx, next) => {
        Page.currentUrl = currentUrl(ctx);
        Page.authorization = ctx.request.headers.get("Authorization");
        Page.dark = await ctx.cookies.get(DarkModeCookie) === "true";
        await next();
    });

    app.use(languageMiddleware);
    app.use(handleServerError);

    const routers = RouterRegistry.get();
    for (const router of routers) {
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
            secure: true as const,
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
