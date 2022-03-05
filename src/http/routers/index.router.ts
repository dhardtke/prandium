import { container } from "../../../deps.ts";
import { Oak } from "../../../deps_oak.ts";
import { IndexController } from "../../controllers/index.controller.ts";
import { OrderBy } from "../../data/service/util/order-by.ts";
import { toInt } from "../../data/util/convert.ts";
import { orderByHelper } from "../middleware/helpers/order_by_helper.ts";
import { PaginationHelper } from "../middleware/helpers/pagination_helper.ts";
import { parameters } from "../util/parameters.ts";
import { AppState } from "../webserver.ts";

export const DEFAULT_ORDER_BY: OrderBy = { column: "title" } as const;

export const IndexRouter = new Oak.Router()
  .get("/", (ctx: Oak.Context<AppState>) => {
    const tagIds = ctx.request.url.searchParams.getAll("tagId").map((id) => toInt(id, -1)).filter((i) => i !== -1);
    const title = parameters(ctx).get("title");
    const orderBy = orderByHelper(ctx, DEFAULT_ORDER_BY);
    const paginationParams = container.resolve<PaginationHelper>(PaginationHelper)
      .buildPaginationParams(ctx);

    const showTagFilter = ctx.request.url.searchParams.has("tagFilter");
    const indexController = container.resolve(IndexController);
    ctx.response.body = indexController.list({ tagIds, title }, showTagFilter, orderBy, paginationParams);
  });
