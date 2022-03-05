import { log } from "../../../deps.ts";
import { Oak } from "../../../deps_oak.ts";
import { Error404 } from "../../tpl/templates/error/error_404.template.ts";
import { Error500 } from "../../tpl/templates/error/error_500.template.ts";
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
      ctx.response.body = Error404();
    } else {
      log.error(e);
      ctx.response.status = 500;
      ctx.response.body = Error500();
    }
  }
}

export function handleNotFound() {
  throw new NotFoundError();
}

export class NotFoundError extends Error {
}
