import * as needle from "@needle-di/core";
import { IndexController } from "../../controllers/index.controller.ts";
import { OrderBy } from "../../data/service/util/order-by.ts";
import { toInt } from "../../data/util/convert.ts";
import { orderByHelper } from "../middleware/helpers/order-by-helper.ts";
import { PaginationHelper } from "../middleware/helpers/pagination-helper.ts";
import { html } from "../server/responses.ts";
import { AppRequest } from "../server/types.ts";
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
        this.get("/", this.getIndex);
    }

    getIndex = (req: AppRequest): Response => {
        const tagIds = req.url.searchParams
            .getAll("tagId")
            .map((id) => toInt(id, -1))
            .filter((i) => i !== -1);
        const title = parameters(req.url).get("title");
        const orderBy = orderByHelper(req.url, DEFAULT_ORDER_BY);
        const paginationParams = this.paginationHelper.buildPaginationParams(req.url);

        const showTagFilter = req.url.searchParams.has("tagFilter");
        return html(this.indexController.list({ tagIds, title }, showTagFilter, orderBy, paginationParams));
    };
}
