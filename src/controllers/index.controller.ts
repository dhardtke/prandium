import { singleton } from "../../deps.ts";
import { RecipeService } from "../data/service/recipe.service.ts";
import { TagService } from "../data/service/tag.service.ts";
import { OrderBy } from "../data/service/util/order-by.ts";
import { paginationHelper, PaginationParams } from "../http/middleware/helpers/pagination_helper.ts";
import { RecipeListTemplate } from "../tpl/templates/recipe/recipe_list.template.ts";

@singleton()
export class IndexController {
  constructor(private recipeService: RecipeService, private tagService: TagService) {
  }

  list(filters: { tagIds: number[]; title: string }, showTagFilter: boolean, orderBy: OrderBy | undefined, paginationParams: PaginationParams) {
    const recipes = paginationHelper(
      paginationParams,
      this.recipeService.count(filters),
      (limit, offset) =>
        this.recipeService.list(
          {
            limit,
            offset,
            orderBy,
            filters,
          },
        ),
    );

    const tags = this.tagService.list({
      orderBy: { column: "title" },
      loadRecipeCount: true,
      filters: {
        tagsWithSameRecipes: {
          ids: filters.tagIds,
          includeOthers: true,
        },
      },
    });

    return RecipeListTemplate(
      recipes,
      tags,
      showTagFilter,
    );
  }
}
