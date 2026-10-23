import { OrderBy } from "../../../data/service/util/order-by.ts";
import { parameters } from "../../util/parameters.ts";

export function orderByHelper(url: URL, _default?: OrderBy): OrderBy | undefined {
    const column = parameters(url).get("orderBy");
    if (column) {
        return {
            column,
            order: parameters(url).get("order")?.toUpperCase() === "DESC" ? "DESC" : "ASC",
        };
    }
    return _default;
}
