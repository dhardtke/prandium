import { Oak } from "../../../deps_oak.ts";
import { RecipeService } from "../../data/service/recipe.service.ts";
import { services } from "../../data/service/services.ts";
import { TagService } from "../../data/service/tag.service.ts";
import { toInt } from "../../data/util/convert.ts";
import { RecipeListTemplate } from "../../tpl/templates/recipe/recipe_list.template.ts";
import { orderByHelper } from "../middleware/helpers/order_by_helper.ts";
import { paginationHelper } from "../middleware/helpers/pagination_helper.ts";
import { parameters } from "../util/parameters.ts";
import { AppState } from "../webserver.ts";

const router: Oak.Router = new Oak.Router();
router.get("/", (ctx: Oak.Context<AppState>) => {
  const service: RecipeService = services.get(RecipeService);

  const tagIds = ctx.request.url.searchParams.getAll("tagId").map((id) => toInt(id, -1)).filter((i) => i !== -1);
  const title = parameters(ctx).get("title");
  const recipes = paginationHelper(
    ctx,
    service.count({ tagIds, title }),
    (limit, offset) =>
      service.list(
        {
          limit,
          offset,
          orderBy: orderByHelper(ctx, { column: "title" }),
          filters: {
            tagIds,
            title,
          },
        },
      ),
  );

  const tags = services.get(TagService).list({
    orderBy: { column: "title" },
    loadRecipeCount: true,
    filters: {
      tagsWithSameRecipes: {
        ids: tagIds,
        includeOthers: true,
      },
    },
  });
  ctx.response.body = RecipeListTemplate(
    recipes,
    tags,
    ctx.request.url.searchParams.has("tagFilter"),
  );
});

export { router as IndexRouter };
