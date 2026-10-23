import { Database } from "../data/db.ts";
import { Settings } from "../data/settings.ts";
import { log } from "../logging.ts";
import { DarkModeCookie } from "../shared/constants.ts";
import { Page } from "../tpl/templates/_structure/page.tsx";
import { errorHandler, notFound } from "./middleware/error.ts";
import { languageMiddleware } from "./middleware/language.ts";
import { RouterRegistry } from "./routers/router-registry.ts";
import { compose } from "./server/compose.ts";
import { cookiesMiddleware } from "./server/cookies.ts";
import { toAppRequest } from "./server/request.ts";
import { Handler, Middleware, RouteTable } from "./server/types.ts";

/**
 * Sets the request-specific globals used by the templates.
 */
const pageGlobals: Middleware = (req, next) => {
    Page.currentUrl = req.url;
    Page.authorization = req.request.headers.get("Authorization");
    Page.dark = req.cookies.get(DarkModeCookie) === "true";
    return next();
};

export const GLOBAL_MIDDLEWARE: Middleware[] = [cookiesMiddleware, pageGlobals, languageMiddleware, errorHandler];

type BunRouteHandler = (request: Bun.BunRequest) => Response | Promise<Response>;

/**
 * Builds the routes for Bun.serve. Bun.serve routes bypass `fetch`, so every handler is wrapped with the global middleware.
 */
export function buildRoutes(routeTables: RouteTable[], middleware: Middleware[] = GLOBAL_MIDDLEWARE): Record<string, Record<string, BunRouteHandler>> {
    const routes: Record<string, Record<string, BunRouteHandler>> = {};
    for (const table of routeTables) {
        for (const [path, handlers] of Object.entries(table)) {
            for (const [method, handler] of Object.entries(handlers)) {
                const composed = compose(middleware, handler);
                routes[path] = {
                    ...routes[path],
                    [method]: (request: Bun.BunRequest) => composed(toAppRequest(request, request.params)),
                };
            }
        }
    }
    return routes;
}

/**
 * The handler for all requests that do not match any route (or method).
 */
export function fallbackHandler(middleware: Middleware[] = GLOBAL_MIDDLEWARE): (request: Request) => Promise<Response> {
    const composed: Handler = compose(middleware, notFound);
    return async (request: Request) => await composed(toAppRequest(request));
}

export async function spawnServer(args: {
    host: string;
    port: number;
    debug?: boolean;
    secure?: boolean;
    key?: string;
    cert?: string;
    configDir: string;
    db: Database;
    settings: Settings;
    /** Stops the server when aborted (in addition to SIGINT / SIGTERM). */
    signal?: AbortSignal;
    /** Invoked with the URL of the server once it is listening. */
    onListen?: (url: URL) => void;
}): Promise<void> {
    const server = Bun.serve({
        hostname: args.host,
        port: args.port,
        development: false,
        ...(args.secure ? { tls: { cert: Bun.file(args.cert || ""), key: Bun.file(args.key || "") } } : {}),
        routes: buildRoutes(RouterRegistry.get().map((router) => router.routes())),
        fetch: fallbackHandler(),
        error(error) {
            log.error(error);
            return new Response("Internal Server Error", { status: 500 });
        },
    });

    const protocol = args.secure ? "https" : "http";
    const url = new URL(`${protocol}://${server.hostname}:${server.port}`);
    log.info(`Server started: Listening on ${protocol}://${server.hostname}:${server.port}`);
    args.onListen?.(url);

    await new Promise<void>((resolve) => {
        const stop = async () => {
            process.off("SIGINT", stop);
            process.off("SIGTERM", stop);
            args.signal?.removeEventListener("abort", stop);
            await server.stop();
            resolve();
        };
        process.on("SIGINT", stop);
        process.on("SIGTERM", stop);
        if (args.signal?.aborted) {
            stop();
        } else {
            args.signal?.addEventListener("abort", stop);
        }
    });
}
