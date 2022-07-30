import { log, Oak } from "../../../deps.ts";
import { Error404 } from "../../tpl/templates/error/error-404.template.tsx";
import { Error500 } from "../../tpl/templates/error/error-500.template.tsx";
import { renderTemplate } from "../../tpl/util/render.ts";
import { AppState } from "../webserver.ts";

export async function handleServerError(
    ctx: Oak.Context<AppState>,
    next: () => Promise<unknown>,
) {
    try {
        await next();
    } catch (e) {
        if (e instanceof NotFoundError) {
            log.debug(e);
            ctx.response.status = 404;
            ctx.response.body = renderTemplate(Error404());
        } else {
            log.error(e);
            ctx.response.status = 500;
            ctx.response.body = renderTemplate(Error500());
        }
    }
}

export function handleNotFound() {
    throw new NotFoundError();
}

export class NotFoundError extends Error {
}
