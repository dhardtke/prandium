import type { RecipeFilterDto, RecipeSortDto } from '../../../../shared/dto/recipe.ts';
import { json, optionalQueryOneOf, optionalQueryString, queryIds, queryInt, readJsonObject } from '../../../http/http.ts';
import { MAX_SEARCH_LENGTH, RECIPE_SORT_KEYS, type RecipesFacade } from '../recipes.facade.ts';
import { translateToCreateRecipeDto, translateToRecipeDto, translateToRecipePageDto } from './recipe.translator.ts';

export const DEFAULT_PAGE_SIZE = 24;

export class RecipeController {
  readonly #recipes: RecipesFacade;

  constructor(recipes: RecipesFacade) {
    this.#recipes = recipes;
  }

  list(req: Request): Response {
    const params = new URL(req.url).searchParams;
    const limit = queryInt(params, 'limit', DEFAULT_PAGE_SIZE, { min: 1, max: 200 });
    const offset = queryInt(params, 'offset', 0, { min: 0, max: 100000 });
    const filter = this.#filter(params);
    const sort: RecipeSortDto = {
      sort: optionalQueryOneOf(params, 'sort', RECIPE_SORT_KEYS) ?? 'title',
      order: optionalQueryOneOf(params, 'order', ['asc', 'desc']) ?? 'asc',
    };
    return json(translateToRecipePageDto(this.#recipes.list(filter, sort, limit, offset), this.#recipes.count(filter), limit, offset));
  }

  async create(req: Request): Promise<Response> {
    const dto = translateToCreateRecipeDto(await readJsonObject(req));
    return json(translateToRecipeDto(this.#recipes.create(dto)), 201);
  }

  #filter(params: URLSearchParams): RecipeFilterDto {
    const filter: RecipeFilterDto = {};
    const search = optionalQueryString(params, 'search', MAX_SEARCH_LENGTH);
    if (search !== null) {
      filter.search = search;
    }
    const tags = queryIds(params, 'tag');
    if (tags.length > 0) {
      filter.tags = tags;
    }
    return filter;
  }
}
