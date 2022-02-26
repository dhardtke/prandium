import type {
  Context,
  RouteParams,
  State,
} from "https://deno.land/x/oak@v10.4.0/mod.ts";
import { OrderBy } from "../../../data/service/service.ts";

declare module "https://deno.land/x/oak@v10.4.0/mod.ts" {
  interface Context {
    orderBy: (_default?: OrderBy) => OrderBy | undefined;
  }

  // noinspection JSUnusedGlobalSymbols
  interface RouterContext<
    R extends string,
    P extends RouteParams<R> = RouteParams<R>,
    // deno-lint-ignore no-explicit-any
    S extends State = Record<string, any>,
  > {
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
