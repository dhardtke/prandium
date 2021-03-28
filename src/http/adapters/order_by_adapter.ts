import { OrderBy } from "../../data/service/service.ts";
import { Oak } from "../../deps.ts";

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
      const raw = ctx.parameter("orderBy"); // e.g. ?orderBy=title:desc;id:asc
      const result: OrderBy = new Map();
      if (raw) {
        const columns = raw.split(";");
        for (const column of columns) {
          const [columnName, order] = column.split(":");
          result.set(columnName, order === "desc");
        }
      }
      return result;
    };

    await next();
  };
};
