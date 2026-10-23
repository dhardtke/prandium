import type { RecipeFilterDto, RecipeSortDto } from '../../../../shared/dto/recipe.ts';
import { notFound } from '../../../http/errors.ts';
import {
  json,
  MAX_BODY_BYTES,
  noContent,
  optionalQueryOneOf,
  optionalQueryString,
  pathId,
  queryIds,
  queryInt,
  readBytes,
  readJsonObject,
} from '../../../http/http.ts';
import type { ParamRequest } from '../../../http/routing.ts';
import type { RecipeId } from '../../../../shared/flavors.ts';
import { MAX_SEARCH_LENGTH, RECIPE_SORT_KEYS, type RecipesFacade } from '../recipes.facade.ts';
import { translateToCreateRecipeDto, translateToEditRecipeDto, translateToRecipeDto, translateToRecipePageDto } from './recipe.translator.ts';

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

  show(req: ParamRequest): Response {
    return json(translateToRecipeDto(this.#recipes.require(pathId(req.params.id, 'recipe'))));
  }

  async update(req: ParamRequest): Promise<Response> {
    const id: RecipeId = pathId(req.params.id, 'recipe');
    const dto = translateToEditRecipeDto(await readJsonObject(req));
    return json(translateToRecipeDto(this.#recipes.update(id, dto)));
  }

  async delete(req: ParamRequest): Promise<Response> {
    await this.#recipes.delete(pathId(req.params.id, 'recipe'));
    return noContent();
  }

  async putThumbnail(req: ParamRequest): Promise<Response> {
    const id: RecipeId = pathId(req.params.id, 'recipe');
    const { bytes, type } = await readBytes(req, { types: ['image/'], maxBytes: MAX_BODY_BYTES });
    return json(translateToRecipeDto(await this.#recipes.setThumbnail(id, bytes, type)));
  }

  async deleteThumbnail(req: ParamRequest): Promise<Response> {
    return json(translateToRecipeDto(await this.#recipes.removeThumbnail(pathId(req.params.id, 'recipe'))));
  }

  /** The old server-rendered URLs, so bookmarks keep working. */
  legacy(req: ParamRequest, suffix: '' | '/edit'): Response {
    const id = req.params.id ?? '';
    if (!/^\d+$/.test(id)) {
      throw notFound('Recipe');
    }
    return Response.redirect(new URL(`/recipes/${id}${suffix}`, req.url), 301);
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
