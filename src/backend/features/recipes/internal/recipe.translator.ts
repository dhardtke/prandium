import type { CreateRecipeDto, EditRecipeDto, NutritionDto, RecipeDto, RecipePageDto, RecipeSummaryDto, ReviewDto } from '../../../../shared/dto/recipe.ts';
import type { Iso8601DateTime } from '../../../../shared/flavors.ts';
import type { RecipeDetails, RecipeRow, RecipeSummaryRow, ReviewRow } from '../ports/recipe.ts';
import { parseIngredients } from './ingredient/ingredient.ts';
import type { CreateRecipe, EditRecipe } from './recipe.repository.ts';

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
    ...nutritionColumns(dto.nutrition),
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

export function translateToEditRecipeDto(body: Record<string, unknown>): EditRecipeDto {
  return { ...translateToCreateRecipeDto(body), title: body.title as string | undefined };
}

type NutritionColumns = Pick<
  CreateRecipe,
  | 'nutrition_calories'
  | 'nutrition_carbohydrate'
  | 'nutrition_cholesterol'
  | 'nutrition_fat'
  | 'nutrition_fiber'
  | 'nutrition_protein'
  | 'nutrition_saturated_fat'
  | 'nutrition_sodium'
  | 'nutrition_sugar'
  | 'nutrition_trans_fat'
  | 'nutrition_unsaturated_fat'
>;

function nutritionColumns(nutrition: Partial<NutritionDto>): NutritionColumns {
  return {
    nutrition_calories: nutrition.calories ?? null,
    nutrition_carbohydrate: nutrition.carbohydrate ?? null,
    nutrition_cholesterol: nutrition.cholesterol ?? null,
    nutrition_fat: nutrition.fat ?? null,
    nutrition_fiber: nutrition.fiber ?? null,
    nutrition_protein: nutrition.protein ?? null,
    nutrition_saturated_fat: nutrition.saturatedFat ?? null,
    nutrition_sodium: nutrition.sodium ?? null,
    nutrition_sugar: nutrition.sugar ?? null,
    nutrition_trans_fat: nutrition.transFat ?? null,
    nutrition_unsaturated_fat: nutrition.unsaturatedFat ?? null,
  };
}

/** `dto` is validated: a field is present only when it is to change. */
export function translateDtoToEditRecipe(dto: EditRecipeDto): EditRecipe {
  const flagged = dto.flagged === undefined ? undefined : Number(dto.flagged);
  return {
    title: dto.title,
    flagged,
    description: dto.description,
    source: dto.source,
    yield: dto.yield === undefined ? undefined : (dto.yield ?? 1),
    ...(dto.nutrition === undefined ? {} : nutritionColumns(dto.nutrition)),
    prep_time: dto.prepTime,
    cook_time: dto.cookTime,
    aggregate_rating_value: dto.aggregateRating === undefined ? undefined : (dto.aggregateRating.value ?? null),
    aggregate_rating_count: dto.aggregateRating === undefined ? undefined : (dto.aggregateRating.count ?? null),
    rating: dto.rating,
    ingredients: dto.ingredients,
    instructions: dto.instructions,
    history: dto.history,
    tags: dto.tags,
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
