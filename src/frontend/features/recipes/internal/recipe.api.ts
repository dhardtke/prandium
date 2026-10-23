import type { CreateRecipeDto, EditRecipeDto, RecipeDto, RecipeFilterDto, RecipePageDto, RecipeSortDto } from '../../../../shared/dto/recipe.ts';
import type { RecipeId } from '../../../../shared/flavors.ts';
import { get, patch, post, remove } from '../../../http/http.ts';

export type RecipeListRequest = RecipeFilterDto & Partial<RecipeSortDto> & { limit: number; offset: number };

export class RecipeApi {
  list({ limit, offset, search, tags, sort, order }: RecipeListRequest): Promise<RecipePageDto> {
    const query = new URLSearchParams({ limit: String(limit), offset: String(offset) });
    if (search !== undefined && search !== '') {
      query.set('search', search);
    }
    for (const tag of tags ?? []) {
      query.append('tag', String(tag));
    }
    if (sort !== undefined) {
      query.set('sort', sort);
    }
    if (order !== undefined) {
      query.set('order', order);
    }
    return get(`/recipes?${query.toString()}`);
  }

  get(id: RecipeId): Promise<RecipeDto> {
    return get(`/recipes/${id}`);
  }

  create(dto: CreateRecipeDto): Promise<RecipeDto> {
    return post('/recipes', dto);
  }

  update(id: RecipeId, dto: EditRecipeDto): Promise<RecipeDto> {
    return patch(`/recipes/${id}`, dto);
  }

  delete(id: RecipeId): Promise<null> {
    return remove(`/recipes/${id}`);
  }
}
