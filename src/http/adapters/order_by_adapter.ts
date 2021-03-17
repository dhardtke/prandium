import { Oak } from "../../deps.ts";
import { OrderBy } from "../../data/util/sql.ts";

declare module "https://deno.land/x/oak@v6.5.0/mod.ts" {
  interface Context {
    orderBy: () => OrderBy;
  }

  // noinspection JSUnusedGlobalSymbols
  interface RouterContext {
    orderBy: () => OrderBy;
  }
}

export const orderByAdapter = () => {
  return async function (ctx: Oak.Context, next: () => Promise<void>) {
    ctx.orderBy = function (): OrderBy {
      return new OrderBy(
        ctx.parameter("orderBy"),
        ctx.parameter("order"),
      );
    };

    await next();
  };
};
