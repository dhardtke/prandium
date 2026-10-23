import type { RecipeId, TagId } from '../../../../shared/flavors.ts';

export const NUTRITION_COLUMNS = [
  'nutrition_calories',
  'nutrition_carbohydrate',
  'nutrition_cholesterol',
  'nutrition_fat',
  'nutrition_fiber',
  'nutrition_protein',
  'nutrition_saturated_fat',
  'nutrition_sodium',
  'nutrition_sugar',
  'nutrition_trans_fat',
  'nutrition_unsaturated_fat',
] as const;

export type NutritionColumn = (typeof NUTRITION_COLUMNS)[number];

export const RECIPE_SORT_KEYS = [
  'id',
  'title',
  'cooked_count',
  'flagged',
  'aggregate_rating_value',
  'rating',
  'created_at',
  'updated_at',
  'last_cooked_at',
  'prep_time',
  'cook_time',
  'total_time',
  ...NUTRITION_COLUMNS,
] as const;

export type RecipeSortColumn = (typeof RECIPE_SORT_KEYS)[number];

/** Columns as stored: rows from before this code may hold NULL in any nullable one, and dates in either SQLite's or ISO form. */
export type RecipeRow = {
  id: RecipeId;
  title: string;
  flagged: number | null;
  description: string | null;
  source: string | null;
  thumbnail: string | null;
  yield: number | null;
  prep_time: number | null;
  cook_time: number | null;
  aggregate_rating_value: number | null;
  aggregate_rating_count: number | null;
  rating: number | null;
  /** JSON arrays of strings. */
  ingredients: string | null;
  instructions: string | null;
  created_at: string;
  updated_at: string;
} & Record<NutritionColumn, string | null>;

export interface RecipeSummaryRow {
  id: RecipeId;
  title: string;
  flagged: number | null;
  description: string | null;
  thumbnail: string | null;
  rating: number | null;
  aggregate_rating_value: number | null;
  aggregate_rating_count: number | null;
  total_time: number;
  cooked_count: number;
  last_cooked_at: string | null;
}

export interface RecipeTagRow {
  id: TagId;
  title: string;
}

export interface ReviewRow {
  date: string;
  text: string;
}

export interface RecipeDetails {
  recipe: RecipeRow;
  tags: RecipeTagRow[];
  /** Newest first. */
  history: string[];
  reviews: ReviewRow[];
}

export interface RecipeFilter {
  title_contains?: string;
  /** Recipes carrying every one of these tags. */
  tag_ids?: TagId[];
}

export interface RecipeSort {
  column: RecipeSortColumn;
  order: 'asc' | 'desc';
}
