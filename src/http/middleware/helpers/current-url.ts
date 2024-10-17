import { Oak } from "../../../../deps.ts";

export function currentUrl(ctx: Oak.Context): URL {
    const base = new URL(ctx.request.url);
    base.port = (ctx.request.headers.get("host") ?? "").split(":")[1] ?? "";
    return base;
}
