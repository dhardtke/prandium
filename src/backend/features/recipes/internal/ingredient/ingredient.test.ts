import { describe, expect, test } from 'bun:test';
import type { IngredientDto } from '../../../../../shared/dto/recipe.ts';
import { parseIngredient, parseIngredients } from './ingredient.ts';

describe('parseIngredient', () => {
  test.each<[string, Omit<IngredientDto, 'raw'>]>([
    ['Salz, Pfeffer', { quantity: null, unit: null, description: 'Salz, Pfeffer' }],
    ['1g Salz', { quantity: 1, unit: 'g', description: 'Salz' }],
    ['2½ EL Zucker', { quantity: 2.5, unit: 'EL', description: 'Zucker' }],
    ['2 ½ EL Zucker', { quantity: 2.5, unit: 'EL', description: 'Zucker' }],
    ['⅕ Apfel', { quantity: 1 / 5, unit: null, description: 'Apfel' }],
    ['1 g Salz', { quantity: 1, unit: 'g', description: 'Salz' }],
    ['1 TL Zucker', { quantity: 1, unit: 'TL', description: 'Zucker' }],
    ['1 l Wasser', { quantity: 1, unit: 'l', description: 'Wasser' }],
    ['1 L Wasser', { quantity: 1, unit: 'L', description: 'Wasser' }],
    ['2 Esslöffel Pfeffer', { quantity: 2, unit: 'Esslöffel', description: 'Pfeffer' }],
    ['4kg Nudeln', { quantity: 4, unit: 'kg', description: 'Nudeln' }],
    ['4 kg Nudeln', { quantity: 4, unit: 'kg', description: 'Nudeln' }],
    ['1-2 Teelöffel Kümmel', { quantity: { from: 1, to: 2 }, unit: 'Teelöffel', description: 'Kümmel' }],
    ['1 - 2 Teelöffel Kümmel', { quantity: { from: 1, to: 2 }, unit: 'Teelöffel', description: 'Kümmel' }],
    ['4 große Paprika', { quantity: 4, unit: null, description: 'große Paprika' }],
    ['0.5 Kalbsfond', { quantity: 0.5, unit: null, description: 'Kalbsfond' }],
  ])('parses %p', (raw, parsed) => {
    expect(parseIngredient(raw)).toEqual({ raw, ...parsed });
  });

  test('keeps the quantity unscaled and unrounded', () => {
    expect(parseIngredient('⅓ TL Salz').quantity).toBe(1 / 3);
  });

  test.each(['', 'abc', '0', '42', '1 /'])('does not throw on %p', (raw) => {
    expect(parseIngredient(raw).raw).toBe(raw);
  });
});

describe('parseIngredients', () => {
  test('sorts quantity and unit first, by unit, then a quantity alone, then neither', () => {
    const input = ['Salz / Pfeffer', '4g Zucker', '1 Banane', '2 EL Olivenöl', '200g Nudeln', '3 Lorbeeren', 'Zitronenschale'];
    const sorted = parseIngredients(input).map((ingredient) => ingredient.raw);
    expect(sorted).toEqual(['2 EL Olivenöl', '4g Zucker', '200g Nudeln', '1 Banane', '3 Lorbeeren', 'Salz / Pfeffer', 'Zitronenschale']);
  });

  test('leaves the input alone', () => {
    const input = ['Salz', '1 g Zucker'];
    parseIngredients(input);
    expect(input).toEqual(['Salz', '1 g Zucker']);
  });
});
