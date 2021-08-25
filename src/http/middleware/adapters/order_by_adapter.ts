import type { Context } from "https://deno.land/x/oak@v9.0.0/mod.ts";
import { OrderBy } from "../../../data/service/service.ts";

declare module "https://deno.land/x/oak@v9.0.0/mod.ts" {
  interface Context {
    orderBy: (_default?: OrderBy) => OrderBy | undefined;
  }

  // noinspection JSUnusedGlobalSymbols
  interface RouterContext {
    orderBy: (_default?: OrderBy) => OrderBy | undefined;
  }
}

export const orderByAdapter = () => {
  return async function (ctx: Context, next: () => Promise<unknown>) {
    ctx.orderBy = function (_default?: OrderBy): OrderBy | undefined {
      const column = ctx.parameter("orderBy");
      if (column) {
        return {
          column,
          order: ctx.parameter("order")?.toUpperCase() === "DESC"
            ? "DESC"
            : "ASC",
        };
      }
      return _default;
    };

    await next();
  };
};
