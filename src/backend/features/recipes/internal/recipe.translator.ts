import type { CreateRecipeDto, NutritionDto, RecipeDto, RecipePageDto, RecipeSummaryDto, ReviewDto } from '../../../../shared/dto/recipe.ts';
import type { Iso8601DateTime } from '../../../../shared/flavors.ts';
import type { RecipeDetails, RecipeRow, RecipeSummaryRow, ReviewRow } from '../ports/recipe.ts';
import { parseIngredients } from './ingredient/ingredient.ts';
import type { CreateRecipe } from './recipe.repository.ts';

export function translateToCreateRecipeDto(body: Record<string, unknown>): CreateRecipeDto {
  return {
    title: body.title as string,
    flagged: body.flagged as boolean | undefined,
    description: body.description as string | undefined,
    source: body.source as string | undefined,
    yield: body.yield as number | null | undefined,
    nutrition: body.nutrition as Partial<NutritionDto> | undefined,
    prepTime: body.prepTime as number | undefined,
    cookTime: body.cookTime as number | undefined,
    aggregateRating: body.aggregateRating as CreateRecipeDto['aggregateRating'],
    rating: body.rating as number | undefined,
    ingredients: body.ingredients as string[] | undefined,
    instructions: body.instructions as string[] | undefined,
    history: body.history as Iso8601DateTime[] | undefined,
    tags: body.tags as string[] | undefined,
  };
}

/** `dto` is validated: every field is present and normalized. */
export function translateDtoToCreateRecipe(dto: Required<CreateRecipeDto>, extra: { thumbnail: string | null; reviews: ReviewRow[] }): CreateRecipe {
  return {
    title: dto.title,
    flagged: dto.flagged ? 1 : 0,
    description: dto.description,
    source: dto.source,
    thumbnail: extra.thumbnail,
    // A recipe without a yield scales as if it served one.
    yield: dto.yield ?? 1,
    nutrition_calories: dto.nutrition.calories ?? null,
    nutrition_carbohydrate: dto.nutrition.carbohydrate ?? null,
    nutrition_cholesterol: dto.nutrition.cholesterol ?? null,
    nutrition_fat: dto.nutrition.fat ?? null,
    nutrition_fiber: dto.nutrition.fiber ?? null,
    nutrition_protein: dto.nutrition.protein ?? null,
    nutrition_saturated_fat: dto.nutrition.saturatedFat ?? null,
    nutrition_sodium: dto.nutrition.sodium ?? null,
    nutrition_sugar: dto.nutrition.sugar ?? null,
    nutrition_trans_fat: dto.nutrition.transFat ?? null,
    nutrition_unsaturated_fat: dto.nutrition.unsaturatedFat ?? null,
    prep_time: dto.prepTime,
    cook_time: dto.cookTime,
    aggregate_rating_value: dto.aggregateRating.value ?? null,
    aggregate_rating_count: dto.aggregateRating.count ?? null,
    rating: dto.rating,
    ingredients: dto.ingredients,
    instructions: dto.instructions,
    history: dto.history,
    tags: dto.tags,
    reviews: extra.reviews,
  };
}

// Rows written by SQLite's CURRENT_TIMESTAMP read `2024-03-12 10:00:00`, in UTC.
export function translateToIsoDateTime(stored: string): Iso8601DateTime {
  const sqlite = /^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2})$/.exec(stored);
  const parsed = new Date(sqlite ? `${sqlite[1]}T${sqlite[2]}Z` : stored);
  return Number.isNaN(parsed.getTime()) ? stored : parsed.toISOString();
}

export function translateToThumbnailUrl(file: string | null): string | null {
  return file === null || file === '' ? null : `/thumbnails/${encodeURIComponent(file)}`;
}

function stringArray(json: string | null): string[] {
  if (json === null || json === '') {
    return [];
  }
  try {
    const parsed: unknown = JSON.parse(json);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

function nutritionOf(row: RecipeRow): NutritionDto {
  return {
    calories: row.nutrition_calories,
    carbohydrate: row.nutrition_carbohydrate,
    cholesterol: row.nutrition_cholesterol,
    fat: row.nutrition_fat,
    fiber: row.nutrition_fiber,
    protein: row.nutrition_protein,
    saturatedFat: row.nutrition_saturated_fat,
    sodium: row.nutrition_sodium,
    sugar: row.nutrition_sugar,
    transFat: row.nutrition_trans_fat,
    unsaturatedFat: row.nutrition_unsaturated_fat,
  };
}

function translateToReviewDto(row: ReviewRow): ReviewDto {
  return { date: translateToIsoDateTime(row.date), text: row.text };
}

export function translateToRecipeDto(details: RecipeDetails): RecipeDto {
  const { recipe: row } = details;
  const prepTime = row.prep_time ?? 0;
  const cookTime = row.cook_time ?? 0;
  return {
    id: row.id,
    title: row.title,
    flagged: (row.flagged ?? 0) !== 0,
    description: row.description ?? '',
    source: row.source ?? '',
    thumbnail: translateToThumbnailUrl(row.thumbnail),
    yield: row.yield,
    nutrition: nutritionOf(row),
    prepTime,
    cookTime,
    totalTime: prepTime + cookTime,
    aggregateRating: { value: row.aggregate_rating_value, count: row.aggregate_rating_count },
    rating: row.rating ?? 0,
    ingredients: parseIngredients(stringArray(row.ingredients)),
    instructions: stringArray(row.instructions),
    history: details.history.map(translateToIsoDateTime),
    reviews: details.reviews.map(translateToReviewDto),
    tags: details.tags.map((tag) => ({ id: tag.id, title: tag.title })),
    createdAt: translateToIsoDateTime(row.created_at),
    updatedAt: translateToIsoDateTime(row.updated_at),
  };
}

export function translateToRecipeSummaryDto(row: RecipeSummaryRow): RecipeSummaryDto {
  return {
    id: row.id,
    title: row.title,
    flagged: (row.flagged ?? 0) !== 0,
    description: row.description ?? '',
    thumbnail: translateToThumbnailUrl(row.thumbnail),
    rating: row.rating ?? 0,
    aggregateRating: { value: row.aggregate_rating_value, count: row.aggregate_rating_count },
    totalTime: row.total_time,
    cookedCount: row.cooked_count,
    lastCookedAt: row.last_cooked_at === null ? null : translateToIsoDateTime(row.last_cooked_at),
  };
}

export function translateToRecipePageDto(rows: RecipeSummaryRow[], total: number, limit: number, offset: number): RecipePageDto {
  return { items: rows.map(translateToRecipeSummaryDto), total, limit, offset };
}
