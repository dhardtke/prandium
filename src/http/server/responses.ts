export function html(body: string, init: ResponseInit = {}): Response {
    const headers = new Headers(init.headers);
    headers.set("Content-Type", "text/html; charset=utf-8");
    return new Response(body, { ...init, headers });
}

export function text(body: string, init: ResponseInit = {}): Response {
    const headers = new Headers(init.headers);
    headers.set("Content-Type", "text/plain; charset=utf-8");
    return new Response(body, { ...init, headers });
}

export function redirect(url: string | URL, status = 302): Response {
    return new Response(null, { status, headers: { Location: url.toString() } });
}
