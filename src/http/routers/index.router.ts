import { container } from "../../../deps.ts";
import { Oak } from "../../../deps_oak.ts";
import { IndexController } from "../../controllers/index.controller.ts";
import { toInt } from "../../data/util/convert.ts";
import { orderByHelper } from "../middleware/helpers/order_by_helper.ts";
import { buildPaginationParams } from "../middleware/helpers/pagination_helper.ts";
import { parameters } from "../util/parameters.ts";
import { AppState } from "../webserver.ts";

export const IndexRouter = new Oak.Router()
  .get("/", (ctx: Oak.Context<AppState>) => {
    const tagIds = ctx.request.url.searchParams.getAll("tagId").map((id) => toInt(id, -1)).filter((i) => i !== -1);
    const title = parameters(ctx).get("title");
    const orderBy = orderByHelper(ctx, { column: "title" });
    const paginationParams = buildPaginationParams(ctx);

    // TODO replace by annotation
    const indexController = container.resolve(IndexController);
    ctx.response.body = indexController.list({ tagIds, title }, ctx.request.url.searchParams.has("tagFilter"), orderBy, paginationParams);
  });
