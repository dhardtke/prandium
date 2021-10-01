import type { Context } from "https://deno.land/x/oak@v9.0.1/mod.ts";
import { Oak } from "../../../../deps.ts";

declare module "https://deno.land/x/oak@v9.0.1/mod.ts" {
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
  return async function (ctx: Context, next: () => Promise<unknown>) {
    // TODO remove this abomination ASAP
    ctx.parameter = function (name: string): string {
      if (!ctx.state.query) {
        ctx.state.query = Oak.helpers.getQuery(ctx, { mergeParams: true });
      }

      return ctx.state.query[name];
    };

    await next();
  };
};
