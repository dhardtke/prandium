import type { Context } from "https://deno.land/x/oak@v6.5.1/mod.ts";
import { Eta } from "../../../deps.ts";
import { Template } from "../../tpl/mod.ts";
import { AppState } from "../webserver.ts";

declare module "https://deno.land/x/oak@v6.5.1/mod.ts" {
  interface Context {
    render: <Data>(template: Template<Data>, data: Data) => void;
  }

  // noinspection JSUnusedGlobalSymbols
  interface RouterContext {
    render: <Data>(template: Template<Data>, data: Data) => void;
  }
}

export const templateAdapter = (debug?: boolean) => {
  if (!debug) {
    Eta.configure({
      rmWhitespace: true,
    });
  }

  return async function (
    ctx: Context<AppState>,
    next: () => Promise<void>,
  ) {
    ctx.render = async function <Data>(template: Template<Data>, data?: Data) {
      ctx.response.body = await template.render(
        ctx.state,
        ctx.request.url,
        data,
      );
      ctx.response.headers.set("Content-Type", "text/html; charset=utf-8");
    };

    await next();
  };
};
