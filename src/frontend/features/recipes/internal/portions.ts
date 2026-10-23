import type { IngredientDto, QuantityDto } from '../../../../shared/dto/recipe.ts';

export const MIN_PORTIONS = 1;
export const MAX_PORTIONS = 99;

export function roundUpToThreeDigits(n: number): number {
  return Math.round((n + Number.EPSILON) * 1000) / 1000;
}

/** A recipe without a yield scales as if it served one. */
export function scaleQuantity(quantity: QuantityDto, recipeYield: number | null, portions: number): QuantityDto {
  const factor = Math.max(MIN_PORTIONS, portions) / (recipeYield !== null && recipeYield > 0 ? recipeYield : 1);
  if (typeof quantity === 'number') {
    return roundUpToThreeDigits(quantity * factor);
  }
  return { from: roundUpToThreeDigits(quantity.from * factor), to: roundUpToThreeDigits(quantity.to * factor) };
}

/** `?portions=` when it is a whole number in range, else the yield rounded into range. */
export function initialPortions(search: string, recipeYield: number | null): number {
  const raw = new URLSearchParams(search).get('portions') ?? '';
  if (/^\d+$/.test(raw)) {
    return clampPortions(Number(raw));
  }
  return clampPortions(Math.round(recipeYield ?? 1));
}

export function clampPortions(portions: number): number {
  return Math.min(MAX_PORTIONS, Math.max(MIN_PORTIONS, Math.round(portions)));
}

// Quantity and unit first, then a quantity alone, then neither; then by unit where both lines have one, as the old detail page did.
function rank(ingredient: IngredientDto): number {
  if (ingredient.quantity === null) {
    return 3;
  }
  return ingredient.unit === null ? 2 : 1;
}

export function sortIngredients(ingredients: readonly IngredientDto[]): IngredientDto[] {
  return ingredients.toSorted((a, b) => rank(a) - rank(b)).toSorted((a, b) => (a.unit !== null && b.unit !== null ? a.unit.localeCompare(b.unit) : 0));
}
