import type { CreateRecipeDto, EditRecipeDto, RecipeDto, RecipePageDto } from '../../../shared/dto/recipe.ts';
import type { RecipeId } from '../../../shared/flavors.ts';
import { RecipeApi, type RecipeListRequest } from './internal/recipe.api.ts';

export class RecipeFacade {
  readonly #api: RecipeApi;

  constructor(api: RecipeApi) {
    this.#api = api;
  }

  list(request: RecipeListRequest): Promise<RecipePageDto> {
    return this.#api.list(request);
  }

  get(id: RecipeId): Promise<RecipeDto> {
    return this.#api.get(id);
  }

  create(dto: CreateRecipeDto): Promise<RecipeDto> {
    return this.#api.create(dto);
  }

  update(id: RecipeId, dto: EditRecipeDto): Promise<RecipeDto> {
    return this.#api.update(id, dto);
  }

  delete(id: RecipeId): Promise<null> {
    return this.#api.delete(id);
  }

  putThumbnail(id: RecipeId, image: Blob): Promise<RecipeDto> {
    return this.#api.putThumbnail(id, image);
  }

  deleteThumbnail(id: RecipeId): Promise<RecipeDto> {
    return this.#api.deleteThumbnail(id);
  }
}

export const recipeFacade = new RecipeFacade(new RecipeApi());
