import { Oak } from "../../../../deps.ts";
import { OrderBy } from "../../../data/service/util/order-by.ts";
import { parameters } from "../../util/parameters.ts";

export function orderByHelper(
    ctx: Oak.Context,
    _default?: OrderBy,
): OrderBy | undefined {
    const column = parameters(ctx).get("orderBy");
    if (column) {
        return {
            column,
            order: parameters(ctx).get("order")?.toUpperCase() === "DESC" ? "DESC" : "ASC",
        };
    }
    return _default;
}
