import { Middleware } from "./types.ts";

export function parseCookies(request: Request): Bun.CookieMap {
    return new Bun.CookieMap(request.headers.get("Cookie") ?? "");
}

/**
 * Returns a response that carries a Set-Cookie header for every cookie that has been changed in `cookies`.
 */
export function withCookies(cookies: Bun.CookieMap, response: Response): Response {
    const setCookieHeaders = cookies.toSetCookieHeaders();
    if (!setCookieHeaders.length) {
        return response;
    }
    // copy the response as its headers may be immutable (e.g. for Response.redirect)
    const result = new Response(response.body, response);
    for (const header of setCookieHeaders) {
        result.headers.append("Set-Cookie", header);
    }
    return result;
}

/**
 * Sends the changes made to the request cookies to the client.
 */
export const cookiesMiddleware: Middleware = async (req, next) => {
    return withCookies(req.cookies, await next());
};
