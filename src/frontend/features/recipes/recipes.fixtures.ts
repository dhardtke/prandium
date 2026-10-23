import type { NutritionDto, RecipeDto, RecipePageDto, RecipeSummaryDto } from '../../../shared/dto/recipe.ts';
import type { TagDto } from '../../../shared/dto/tag.ts';

export const NO_NUTRITION: NutritionDto = {
  calories: null,
  carbohydrate: null,
  cholesterol: null,
  fat: null,
  fiber: null,
  protein: null,
  saturatedFat: null,
  sodium: null,
  sugar: null,
  transFat: null,
  unsaturatedFat: null,
};

export function recipe(overrides: Partial<RecipeDto> = {}): RecipeDto {
  return {
    id: 1,
    title: 'Spaghetti Carbonara',
    flagged: false,
    description: '',
    source: '',
    thumbnail: null,
    yield: 4,
    nutrition: NO_NUTRITION,
    prepTime: 0,
    cookTime: 0,
    totalTime: 0,
    aggregateRating: { value: null, count: null },
    rating: 0,
    ingredients: [],
    instructions: [],
    history: [],
    reviews: [],
    tags: [],
    createdAt: '2026-10-01T10:00:00.000Z',
    updatedAt: '2026-10-01T10:00:00.000Z',
    ...overrides,
  };
}

export function summary(overrides: Partial<RecipeSummaryDto> = {}): RecipeSummaryDto {
  return {
    id: 1,
    title: 'Spaghetti Carbonara',
    flagged: false,
    description: '',
    thumbnail: null,
    rating: 0,
    aggregateRating: { value: null, count: null },
    totalTime: 0,
    cookedCount: 0,
    lastCookedAt: null,
    ...overrides,
  };
}

export function recipePage(items: RecipeSummaryDto[], overrides: Partial<RecipePageDto> = {}): RecipePageDto {
  return { items, total: items.length, limit: 24, offset: 0, ...overrides };
}

export function tag(overrides: Partial<TagDto> = {}): TagDto {
  return { id: 1, title: 'Pasta', recipeCount: 1, ...overrides };
}
