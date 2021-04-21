import { toNumber } from "../../data/util/convert.ts";
import { Pagination, PaginationBuilder } from "../../data/pagination.ts";
import type { Context } from "https://deno.land/x/oak@v7.3.0/mod.ts";

declare module "https://deno.land/x/oak@v7.3.0/mod.ts" {
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
  return async function (ctx: Context, next: () => Promise<void>) {
    function extractParams() {
      return {
        page: toNumber(ctx.parameter("page"), 1),
        pageSize: toNumber(ctx.parameter("pageSize"), 24),
      };
    }

    ctx.paginate = function <T>(
      total: number,
      listSupplier: (limit: number, offset: number) => T[],
    ): Pagination<T> {
      const { page, pageSize } = extractParams();

      const currentUrl = new URL(ctx.request.url.toString());
      currentUrl.searchParams.delete("flash");

      return new PaginationBuilder<T>(total, page, pageSize)
        .build(listSupplier, currentUrl);
    };

    await next();
  };
};
