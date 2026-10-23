import { log } from "../../logging.ts";
import { NotFoundError } from "../../shared/errors.ts";
import { Error404 } from "../../tpl/templates/error/error-404.template.tsx";
import { Error500 } from "../../tpl/templates/error/error-500.template.tsx";
import { renderTemplate } from "../../tpl/util/render.ts";
import { html } from "../server/responses.ts";
import { Handler, Middleware } from "../server/types.ts";

/**
 * Renders the 404 page for {@link NotFoundError}s and the 500 page for all other errors.
 */
export const errorHandler: Middleware = async (_req, next) => {
    try {
        return await next();
    } catch (e) {
        if (e instanceof NotFoundError) {
            log.debug(e);
            return html(renderTemplate(Error404()), { status: 404 });
        }
        log.error(e);
        return html(renderTemplate(Error500()), { status: 500 });
    }
};

/**
 * The handler for requests that no route matches.
 */
export const notFound: Handler = () => {
    throw new NotFoundError();
};
