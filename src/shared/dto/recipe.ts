import type { Iso8601DateTime, RecipeId, TagId } from '../flavors.ts';

export interface NutritionDto {
  calories: string | null;
  carbohydrate: string | null;
  cholesterol: string | null;
  fat: string | null;
  fiber: string | null;
  protein: string | null;
  saturatedFat: string | null;
  sodium: string | null;
  sugar: string | null;
  transFat: string | null;
  unsaturatedFat: string | null;
}

export interface AggregateRatingDto {
  value: number | null;
  count: number | null;
}

export type QuantityDto = number | { from: number; to: number };

/** One ingredient line parsed on the server, unscaled; the client scales `quantity` by portions / yield. */
export interface IngredientDto {
  raw: string;
  quantity: QuantityDto | null;
  unit: string | null;
  description: string;
}

export interface ReviewDto {
  date: Iso8601DateTime;
  text: string;
}

export interface RecipeTagDto {
  id: TagId;
  title: string;
}

export interface RecipeDto {
  id: RecipeId;
  title: string;
  flagged: boolean;
  description: string;
  source: string;
  /** The image's URL, or null. */
  thumbnail: string | null;
  yield: number | null;
  nutrition: NutritionDto;
  /** Minutes. */
  prepTime: number;
  cookTime: number;
  totalTime: number;
  aggregateRating: AggregateRatingDto;
  /** 0 to 5 in half stars; 0 means unrated. */
  rating: number;
  ingredients: IngredientDto[];
  instructions: string[];
  /** When the recipe was cooked, newest first. */
  history: Iso8601DateTime[];
  reviews: ReviewDto[];
  tags: RecipeTagDto[];
  createdAt: Iso8601DateTime;
  updatedAt: Iso8601DateTime;
}

export interface RecipeSummaryDto {
  id: RecipeId;
  title: string;
  flagged: boolean;
  description: string;
  thumbnail: string | null;
  rating: number;
  aggregateRating: AggregateRatingDto;
  totalTime: number;
  cookedCount: number;
  lastCookedAt: Iso8601DateTime | null;
}

export interface RecipePageDto {
  items: RecipeSummaryDto[];
  total: number;
  limit: number;
  offset: number;
}

export type RecipeSortKey =
  | 'id'
  | 'title'
  | 'cooked_count'
  | 'flagged'
  | 'aggregate_rating_value'
  | 'rating'
  | 'created_at'
  | 'updated_at'
  | 'last_cooked_at'
  | 'prep_time'
  | 'cook_time'
  | 'total_time'
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
  | 'nutrition_unsaturated_fat';

export type SortOrder = 'asc' | 'desc';

export interface CreateRecipeDto {
  title: string;
  flagged?: boolean;
  description?: string;
  source?: string;
  yield?: number | null;
  nutrition?: Partial<NutritionDto>;
  prepTime?: number;
  cookTime?: number;
  aggregateRating?: Partial<AggregateRatingDto>;
  rating?: number;
  ingredients?: string[];
  instructions?: string[];
  history?: Iso8601DateTime[];
  tags?: string[];
}

export interface RecipeFilterDto {
  search?: string;
  /** Recipes carrying every one of these tags. */
  tags?: TagId[];
}

export interface RecipeSortDto {
  sort: RecipeSortKey;
  order: SortOrder;
}

/** Any subset of the editable fields; `history` and `tags` replace the stored lists when present. */
export type EditRecipeDto = Partial<CreateRecipeDto>;

export interface ImportRecipesDto {
  /** http(s) URLs; blank entries are dropped. */
  urls: string[];
}

export interface ImportResultItemDto {
  url: string;
  recipe: { id: RecipeId; title: string } | null;
  error: string | null;
}

export interface ImportResultDto {
  /** In the order of the request. */
  results: ImportResultItemDto[];
}
