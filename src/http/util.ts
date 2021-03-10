import {Oak} from "../deps.ts";
import {toInt} from "../util.ts";
import {PaginationRequest} from "../data/pagination.ts";

export function paginationRequest(ctx: Oak.Context): PaginationRequest {
    const query = Oak.helpers.getQuery(ctx);
    return {
        limit: toInt(query.limit, -1),
        offset: toInt(query.offset, 0),
        pageSize: toInt(query.pageSize, 25)
    }
}
