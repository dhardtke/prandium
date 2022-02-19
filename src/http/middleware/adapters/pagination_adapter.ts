import type {
  Context,
  RouteParams,
  State,
} from "https://deno.land/x/oak@v10.2.1/mod.ts";
import { Pagination, PaginationBuilder } from "../../../data/pagination.ts";
import { toNumber } from "../../../data/util/convert.ts";
import { AppState } from "../../webserver.ts";

declare module "https://deno.land/x/oak@v10.2.1/mod.ts" {
  interface Context {
    paginate: <T>(
      total: number,
      listSupplier: (limit: number, offset: number) => T[],
    ) => Pagination<T>;
  }

  // noinspection JSUnusedGlobalSymbols
  interface RouterContext<
    R extends string,
    P extends RouteParams<R> = RouteParams<R>,
    // deno-lint-ignore no-explicit-any
    S extends State = Record<string, any>,
  > {
    paginate: <T>(
      total: number,
      listSupplier: (limit: number, offset: number) => T[],
    ) => Pagination<T>;
  }
}

export const paginationAdapter = () => {
  return async function (ctx: Context<AppState>, next: () => Promise<unknown>) {
    function extractParams() {
      return {
        page: toNumber(ctx.parameter("page"), 1),
        pageSize: toNumber(
          ctx.parameter("pageSize"),
          ctx.state.settings.pageSize,
        ),
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
