import { parseCookies } from "./cookies.ts";
import { AppRequest } from "./types.ts";

function firstHeaderValue(request: Request, name: string): string | undefined {
    return request.headers.get(name)?.split(",")[0].trim() || undefined;
}

/**
 * Determines the URL of the request as seen by the client. Behind a reverse proxy, the protocol and host are taken from the X-Forwarded-Proto and
 * X-Forwarded-Host headers.
 */
export function requestUrl(request: Request): URL {
    const url = new URL(request.url);
    const forwardedProto = firstHeaderValue(request, "X-Forwarded-Proto");
    const protocol = forwardedProto === "http" || forwardedProto === "https" ? forwardedProto : url.protocol.slice(0, -1);
    // the URL is rebuilt instead of setting url.host because that setter keeps the original port if the new host has none
    const host = firstHeaderValue(request, "X-Forwarded-Host") ?? url.host;
    try {
        return new URL(`${url.pathname}${url.search}`, `${protocol}://${host}`);
    } catch {
        // invalid forwarding headers
        return url;
    }
}

export function toAppRequest(request: Request, params: Record<string, string> = {}): AppRequest {
    return {
        request,
        url: requestUrl(request),
        params,
        cookies: parseCookies(request),
    };
}
