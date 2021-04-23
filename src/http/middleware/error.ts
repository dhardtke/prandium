import { log, Oak } from "../../../deps.ts";
import { Error404 } from "../../tpl/templates/error/error_404.template.ts";
import { Error500 } from "../../tpl/templates/error/error_500.template.ts";
import { AppState } from "../webserver.ts";

export async function handleServerError(
  ctx: Oak.Context<AppState>,
  next: () => Promise<void>,
) {
  try {
    await next();
  } catch (e) {
    log.error(e);
    ctx.response.status = 500;
    ctx.response.body = Error500();
  }
}

export function handleNotFound(
  ctx: Oak.Context<AppState>,
) {
  ctx.response.status = 404;
  ctx.response.body = Error404();
}
