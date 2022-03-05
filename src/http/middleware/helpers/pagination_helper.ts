import { Oak } from "../../../../deps_oak.ts";
import { Pagination, PaginationBuilder } from "../../../data/pagination.ts";
import { toInt } from "../../../data/util/convert.ts";
import { parameters } from "../../util/parameters.ts";
import { copyUrlAndDo } from "../../util/url.ts";

export interface PaginationParams {
  page: number;
  pageSize: number;
  currentUrl: URL;
}

export function buildPaginationParams(ctx: Oak.Context): PaginationParams {
  return {
    page: toInt(parameters(ctx).get("page"), 1),
    pageSize: toInt(
      parameters(ctx).get("pageSize"),
      ctx.state.settings.pageSize,
    ),
    currentUrl: copyUrlAndDo(ctx.request.url, (url) => url.searchParams.delete("flash")),
  };
}

export function paginationHelper<T>(
  paginationParams: PaginationParams,
  total: number,
  listSupplier: (limit: number, offset: number) => T[],
): Pagination<T> {
  const { page, pageSize, currentUrl } = paginationParams;

  return new PaginationBuilder<T>(total, page, pageSize)
    .build(listSupplier, currentUrl);
}
