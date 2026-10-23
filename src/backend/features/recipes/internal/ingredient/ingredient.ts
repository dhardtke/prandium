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

/** In the stored order: the edit form shows it, and the detail page sorts for display. */
export function parseIngredients(raw: readonly string[]): IngredientDto[] {
  return raw.map(parseIngredient);
}
