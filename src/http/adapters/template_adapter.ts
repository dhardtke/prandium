import { Eta, Oak } from "../../deps.ts";
import { Template } from "../../tpl/mod.ts";

declare module "https://deno.land/x/oak@v6.5.0/mod.ts" {
  interface Context {
    render: <Data>(template: Template<Data>, data: Data) => void;
  }

  // noinspection JSUnusedGlobalSymbols
  interface RouterContext {
    render: <Data>(template: Template<Data>, data: Data) => void;
  }
}

// based on https://deno.land/x/view_engine@v1.4.5/lib/adapters/oak.ts
export const templateAdapter = (debug?: boolean) => {
  if (!debug) {
    Eta.configure({
      rmWhitespace: true,
    });
  }

  return async function (ctx: Oak.Context, next: () => Promise<void>) {
    ctx.render = async function <Data>(template: Template<Data>, data?: Data) {
      ctx.response.body = await template.render(data);
      ctx.response.headers.set("Content-Type", "text/html; charset=utf-8");
    };

    await next();
  };
};
