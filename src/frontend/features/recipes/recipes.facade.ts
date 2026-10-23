import type { CreateRecipeDto, RecipeDto, RecipePageDto } from '../../../shared/dto/recipe.ts';
import { RecipeApi, type RecipeListRequest } from './internal/recipe.api.ts';

export class RecipeFacade {
  readonly #api: RecipeApi;

  constructor(api: RecipeApi) {
    this.#api = api;
  }

  list(request: RecipeListRequest): Promise<RecipePageDto> {
    return this.#api.list(request);
  }

  create(dto: CreateRecipeDto): Promise<RecipeDto> {
    return this.#api.create(dto);
  }
}

export const recipeFacade = new RecipeFacade(new RecipeApi());
