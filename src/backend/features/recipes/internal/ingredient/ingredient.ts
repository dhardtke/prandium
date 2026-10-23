import type { IngredientDto, QuantityDto } from '../../../../../shared/dto/recipe.ts';
import { parse } from './parser.js';

function isQuantity(value: unknown): value is QuantityDto {
  if (typeof value === 'number') {
    return Number.isFinite(value);
  }
  return typeof value === 'object' && value !== null && 'from' in value && 'to' in value && typeof value.from === 'number' && typeof value.to === 'number';
}

/** Unscaled and unrounded: the client scales by portions / yield. */
export function parseIngredient(raw: string): IngredientDto {
  let parsed: unknown;
  try {
    parsed = parse(raw);
  } catch {
    return { raw, quantity: null, unit: null, description: raw };
  }
  const quantity: unknown = typeof parsed === 'object' && parsed !== null && 'quantity' in parsed ? parsed.quantity : null;
  const unit: unknown = typeof parsed === 'object' && parsed !== null && 'unit' in parsed ? parsed.unit : null;
  const description: unknown = typeof parsed === 'object' && parsed !== null && 'description' in parsed ? parsed.description : raw;
  return {
    raw,
    quantity: isQuantity(quantity) ? quantity : null,
    unit: typeof unit === 'string' ? unit : null,
    description: typeof description === 'string' ? description : raw,
  };
}

// Quantity and unit first, then a unit alone, then neither; then by unit, where both lines have one.
function rank(ingredient: IngredientDto): number {
  if (ingredient.quantity === null) {
    return 3;
  }
  return ingredient.unit === null ? 2 : 1;
}

export function parseIngredients(raw: readonly string[]): IngredientDto[] {
  return raw
    .map(parseIngredient)
    .sort((a, b) => rank(a) - rank(b))
    .sort((a, b) => (a.unit !== null && b.unit !== null ? a.unit.localeCompare(b.unit) : 0));
}
