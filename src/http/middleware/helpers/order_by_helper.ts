import { Oak } from "../../../../deps_oak.ts";
import { OrderBy } from "../../../data/service/service.ts";
import { parameters } from "../../util/parameters.ts";

export function orderByHelper(
  ctx: Oak.Context,
  _default?: OrderBy,
): OrderBy | undefined {
  const column = parameters(ctx).get("orderBy");
  if (column) {
    return {
      column,
      order: parameters(ctx).get("order")?.toUpperCase() === "DESC"
        ? "DESC"
        : "ASC",
    };
  }
  return _default;
}
