import type { Context } from "https://deno.land/x/oak@v6.5.1/mod.ts";
import { Oak } from "../../../deps.ts";

declare module "https://deno.land/x/oak@v6.5.1/mod.ts" {
  interface Context {
    _query: Record<string, string>;
    parameter: (name: string) => string | undefined;
  }

  // noinspection JSUnusedGlobalSymbols
  interface RouterContext {
    _query: Record<string, string>;
    parameter: (name: string) => string | undefined;
  }
}

export const parameterAdapter = () => {
  return async function (ctx: Context, next: () => Promise<void>) {
    ctx.parameter = function (name: string): string {
      if (!ctx._query) {
        ctx._query = Oak.helpers.getQuery(ctx, { mergeParams: true });
      }

      return ctx._query[name];
    };

    await next();
  };
};
