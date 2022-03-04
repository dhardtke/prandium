import { Oak } from "../../../../deps_oak.ts";
import { Pagination, PaginationBuilder } from "../../../data/pagination.ts";
import { toInt } from "../../../data/util/convert.ts";
import { parameters } from "../../util/parameters.ts";

function extractParams(ctx: Oak.Context) {
  return {
    page: toInt(parameters(ctx).get("page"), 1),
    pageSize: toInt(
      parameters(ctx).get("pageSize"),
      ctx.state.settings.pageSize,
    ),
  };
}

export function paginationHelper<T>(
  ctx: Oak.Context,
  total: number,
  listSupplier: (limit: number, offset: number) => T[],
): Pagination<T> {
  const { page, pageSize } = extractParams(ctx);

  const currentUrl = new URL(ctx.request.url.toString());
  currentUrl.searchParams.delete("flash");

  return new PaginationBuilder<T>(total, page, pageSize)
    .build(listSupplier, currentUrl);
}
