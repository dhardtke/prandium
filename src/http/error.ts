import { log, Oak } from "../../deps.ts";
import { NotFoundTemplate, ServerErrorTemplate } from "../tpl/mod.ts";
import { AppState } from "./webserver.ts";

export async function handleServerError(
  ctx: Oak.Context<AppState>,
  next: () => Promise<void>,
) {
  try {
    await next();
  } catch (e) {
    log.error(e);
    ctx.response.status = 500;
    await ctx.render(ServerErrorTemplate, null);
  }
}

export async function handleNotFound(
  ctx: Oak.Context<AppState>,
) {
  ctx.response.status = 404;
  await ctx.render(NotFoundTemplate, null);
}
