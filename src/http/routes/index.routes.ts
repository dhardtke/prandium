import { Oak } from "../../../deps_oak.ts";
import { RecipeService } from "../../data/service/recipe.service.ts";
import { services } from "../../data/service/services.ts";
import { TagService } from "../../data/service/tag.service.ts";
import { toNumber } from "../../data/util/convert.ts";
import { RecipeListTemplate } from "../../tpl/templates/recipe/recipe_list.template.ts";
import { AppState } from "../webserver.ts";

const router: Oak.Router = new Oak.Router();
router.get("/", (ctx: Oak.Context<AppState>) => {
  const service: RecipeService = services.get(RecipeService);

  const tagIds = ctx.request.url.searchParams.getAll("tagId").map((id) =>
    toNumber(id, -1)
  ).filter((i) => i !== -1);
  const title = ctx.parameter("title");
  const recipes = ctx.paginate(
    service.count({ tagIds, title }),
    (limit, offset) =>
      service.list(
        {
          limit,
          offset,
          orderBy: ctx.orderBy({ column: "title" }),
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
    ctx.state.settings.infiniteScrolling,
  );
});

export { router as IndexRouter };
