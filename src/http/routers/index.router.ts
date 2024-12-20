import { needle, Oak } from "../../../deps.ts";
import { IndexController } from "../../controllers/index.controller.ts";
import { OrderBy } from "../../data/service/util/order-by.ts";
import { toInt } from "../../data/util/convert.ts";
import { orderByHelper } from "../middleware/helpers/order-by-helper.ts";
import { PaginationHelper } from "../middleware/helpers/pagination-helper.ts";
import { parameters } from "../util/parameters.ts";
import { Router } from "./router.ts";

export const DEFAULT_ORDER_BY: OrderBy = { column: "title" } as const;

@needle.injectable()
export class IndexRouter extends Router {
    constructor(
        private paginationHelper: PaginationHelper = needle.inject(PaginationHelper),
        private indexController: IndexController = needle.inject(IndexController),
    ) {
        super();
        this.router.get("/", this.get);
    }

    get: Oak.RouterMiddleware<"/"> = (ctx) => {
        const tagIds = ctx.request.url.searchParams.getAll("tagId").map((id) => toInt(id, -1)).filter((i) => i !== -1);
        const title = parameters(ctx).get("title");
        const orderBy = orderByHelper(ctx, DEFAULT_ORDER_BY);
        const paginationParams = this.paginationHelper.buildPaginationParams(ctx);

        const showTagFilter = ctx.request.url.searchParams.has("tagFilter");
        ctx.response.body = this.indexController.list({ tagIds, title }, showTagFilter, orderBy, paginationParams);
    };
}
