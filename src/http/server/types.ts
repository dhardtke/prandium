/**
 * A request as seen by middlewares and route handlers.
 */
export interface AppRequest {
    /** The original request. */
    request: Request;
    /** The URL of the request as seen by the client, i.e. honouring X-Forwarded-Proto and X-Forwarded-Host. */
    url: URL;
    /** The parameters of the matched route, e.g. `{ id: "42" }` for `/recipe/:id`. */
    params: Record<string, string>;
    /** The request cookies. Changes are sent to the client via Set-Cookie headers. */
    cookies: Bun.CookieMap;
}

export type Handler = (req: AppRequest) => Response | Promise<Response>;

export type Middleware = (req: AppRequest, next: () => Promise<Response>) => Promise<Response>;

export type Method = "GET" | "POST";

/**
 * Route paths (in the syntax of `Bun.serve` routes) mapped to their handlers per HTTP method.
 */
export type RouteTable = Record<string, Partial<Record<Method, Handler>>>;
