import { singleton } from "../../deps.ts";
import { buildPagination, PaginationParams } from "../data/pagination.ts";
import { RecipeService } from "../data/service/recipe.service.ts";
import { TagService } from "../data/service/tag.service.ts";
import { OrderBy } from "../data/service/util/order-by.ts";
import { RecipeListTemplate } from "../tpl/templates/recipe/recipe-list.template.tsx";
import { renderTemplate } from "../tpl/util/render.ts";

@singleton()
export class IndexController {
  listTemplate = RecipeListTemplate;

  constructor(private recipeService: RecipeService, private tagService: TagService) {
  }

  list(filters: { tagIds: number[]; title: string }, showTagFilter: boolean, orderBy: OrderBy | undefined, paginationParams: PaginationParams) {
    const recipes = buildPagination(
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

    return renderTemplate(this.listTemplate({
      recipes,
      tags,
      showTagFilter,
    }));
  }
}
