import { toInt } from "../../data/util/convert.ts";
import { Oak } from "../../../deps.ts";
import { Pagination, PaginationBuilder } from "../../data/pagination.ts";

declare module "https://deno.land/x/oak@v6.5.0/mod.ts" {
  interface Context {
    paginate: <T>(
      total: number,
      listSupplier: (limit: number, offset: number) => T[],
    ) => Pagination<T>;
  }

  // noinspection JSUnusedGlobalSymbols
  interface RouterContext {
    paginate: <T>(
      total: number,
      listSupplier: (limit: number, offset: number) => T[],
    ) => Pagination<T>;
  }
}

export const paginationAdapter = () => {
  return async function (ctx: Oak.Context, next: () => Promise<void>) {
    function extractParams() {
      return {
        page: toInt(ctx.parameter("page"), 1),
        pageSize: toInt(ctx.parameter("pageSize"), 24),
      };
    }

    ctx.paginate = function <T>(
      total: number,
      listSupplier: (limit: number, offset: number) => T[],
    ): Pagination<T> {
      const { page, pageSize } = extractParams();

      return new PaginationBuilder<T>(total, page, pageSize)
        .build(listSupplier, ctx.request.url);
    };

    await next();
  };
};
