import { Oak } from "../../../deps-oak.ts";
import { singleton } from "../../../deps.ts";
import { IndexController } from "../../controllers/index.controller.ts";
import { OrderBy } from "../../data/service/util/order-by.ts";
import { toInt } from "../../data/util/convert.ts";
import { orderByHelper } from "../middleware/helpers/order-by-helper.ts";
import { PaginationHelper } from "../middleware/helpers/pagination-helper.ts";
import { parameters } from "../util/parameters.ts";
import { Router } from "./router.ts";

export const DEFAULT_ORDER_BY: OrderBy = { column: "title" } as const;

@singleton()
export class IndexRouter extends Router {
  constructor(
    private paginationHelper: PaginationHelper,
    private indexController: IndexController,
  ) {
    super();
    this.router.get("/", this.get);
  }

  get = (ctx: Oak.Context) => {
    const tagIds = ctx.request.url.searchParams.getAll("tagId").map((id) => toInt(id, -1)).filter((i) => i !== -1);
    const title = parameters(ctx).get("title");
    const orderBy = orderByHelper(ctx, DEFAULT_ORDER_BY);
    const paginationParams = this.paginationHelper.buildPaginationParams(ctx);

    const showTagFilter = ctx.request.url.searchParams.has("tagFilter");
    // ctx.response.body = this.indexController.list({ tagIds, title }, showTagFilter, orderBy, paginationParams);
    // ctx.response.body = "Hello";
    ctx.response.body = this.indexController.list({ tagIds, title }, showTagFilter, orderBy, paginationParams);
  };
}
