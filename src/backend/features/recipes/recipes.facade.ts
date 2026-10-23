import type { CreateRecipeDto, NutritionDto, RecipeFilterDto, RecipeSortDto, RecipeSortKey } from '../../../shared/dto/recipe.ts';
import type { RecipeId } from '../../../shared/flavors.ts';
import type { Config } from '../../config.ts';
import type { DB } from '../../db/db.ts';
import { badRequest, notFound } from '../../http/errors.ts';
import { dateTimeList, optionalNumber, optionalString, requiredBoolean, requiredNumber, requiredString, stringList } from '../../shared/validate.ts';
import { createTagFacade } from '../tags/tags.facade.ts';
import { RecipeRepository } from './internal/recipe.repository.ts';
import { translateDtoToCreateRecipe } from './internal/recipe.translator.ts';
import { RECIPE_SORT_KEYS as SORT_COLUMNS, type RecipeDetails, type RecipeSummaryRow, type ReviewRow } from './ports/recipe.ts';

export const RECIPE_SORT_KEYS: readonly RecipeSortKey[] = SORT_COLUMNS satisfies readonly RecipeSortKey[];
export const MAX_SEARCH_LENGTH = 500;

// Bounds are generous on purpose: imports and old rows hold values the form would refuse, and they must save back unchanged.
const LIMITS = {
  title: 500,
  description: 50_000,
  source: 2000,
  yield: 10_000,
  nutrient: 200,
  minutes: 1_000_000,
  ratingValue: 1_000_000,
  ratingCount: 1_000_000_000,
  ingredients: { maxItems: 1000, maxLength: 5000 },
  instructions: { maxItems: 1000, maxLength: 50_000 },
  history: { maxItems: 10_000 },
  tags: { maxItems: 200, maxLength: 200 },
} as const;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export class RecipesFacade {
  readonly #recipes: RecipeRepository;

  constructor(recipes: RecipeRepository) {
    this.#recipes = recipes;
  }

  list(filter: RecipeFilterDto, sort: RecipeSortDto, limit: number, offset: number): RecipeSummaryRow[] {
    return this.#recipes.list({ title_contains: filter.search, tag_ids: filter.tags }, { column: sort.sort, order: sort.order }, limit, offset);
  }

  count(filter: RecipeFilterDto): number {
    return this.#recipes.count({ title_contains: filter.search, tag_ids: filter.tags });
  }

  require(id: RecipeId): RecipeDetails {
    const details = this.#recipes.find(id);
    if (!details) {
      throw notFound('Recipe');
    }
    return details;
  }

  create(dto: CreateRecipeDto, extra: { thumbnail: string | null; reviews: ReviewRow[] } = { thumbnail: null, reviews: [] }): RecipeDetails {
    const id = this.#recipes.create(translateDtoToCreateRecipe(this.#validateCreate(dto), extra));
    return this.require(id);
  }

  #validateCreate(dto: CreateRecipeDto): Required<CreateRecipeDto> {
    return {
      title: requiredString(dto, 'title', LIMITS.title),
      flagged: dto.flagged === undefined ? false : requiredBoolean(dto, 'flagged'),
      description: optionalString(dto, 'description', LIMITS.description) ?? '',
      source: optionalString(dto, 'source', LIMITS.source) ?? '',
      yield: optionalNumber(dto, 'yield', { min: Number.MIN_VALUE, max: LIMITS.yield }),
      nutrition: this.#validateNutrition(dto.nutrition),
      prepTime: dto.prepTime === undefined ? 0 : requiredNumber(dto, 'prepTime', { min: 0, max: LIMITS.minutes }),
      cookTime: dto.cookTime === undefined ? 0 : requiredNumber(dto, 'cookTime', { min: 0, max: LIMITS.minutes }),
      aggregateRating: this.#validateAggregateRating(dto.aggregateRating),
      rating: dto.rating === undefined ? 0 : requiredNumber(dto, 'rating', { min: 0, max: 5 }),
      ingredients: stringList(dto, 'ingredients', LIMITS.ingredients),
      instructions: stringList(dto, 'instructions', LIMITS.instructions),
      history: dateTimeList(dto, 'history', LIMITS.history),
      tags: this.#validateTags(dto),
    };
  }

  #validateNutrition(value: unknown): NutritionDto {
    if (value !== undefined && value !== null && !isObject(value)) {
      throw badRequest('"nutrition" must be an object');
    }
    const nutrition = value ?? {};
    const nutrient = (key: keyof NutritionDto): string | null => {
      try {
        return optionalString(nutrition, key, LIMITS.nutrient);
      } catch {
        throw badRequest(`"nutrition.${key}" must be a string of at most ${LIMITS.nutrient} characters`);
      }
    };
    return {
      calories: nutrient('calories'),
      carbohydrate: nutrient('carbohydrate'),
      cholesterol: nutrient('cholesterol'),
      fat: nutrient('fat'),
      fiber: nutrient('fiber'),
      protein: nutrient('protein'),
      saturatedFat: nutrient('saturatedFat'),
      sodium: nutrient('sodium'),
      sugar: nutrient('sugar'),
      transFat: nutrient('transFat'),
      unsaturatedFat: nutrient('unsaturatedFat'),
    };
  }

  #validateAggregateRating(value: unknown): { value: number | null; count: number | null } {
    if (value === undefined || value === null) {
      return { value: null, count: null };
    }
    if (!isObject(value)) {
      throw badRequest('"aggregateRating" must be an object');
    }
    return {
      value: optionalNumber(value, 'value', { min: 0, max: LIMITS.ratingValue }),
      count: optionalNumber(value, 'count', { min: 0, max: LIMITS.ratingCount }),
    };
  }

  // Tags are matched ignoring case, so two spellings of one tag keep the first.
  #validateTags(dto: CreateRecipeDto): string[] {
    const seen = new Set<string>();
    return stringList(dto, 'tags', LIMITS.tags).filter((title) => {
      const key = title.toLocaleLowerCase();
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }
}

export function createRecipesFacade(db: DB, _config: Config): RecipesFacade {
  return new RecipesFacade(new RecipeRepository(db, createTagFacade(db)));
}
