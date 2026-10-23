import { describe, expect, test } from 'bun:test';
import type { IngredientDto } from '../../../../shared/dto/recipe.ts';
import { clampPortions, initialPortions, roundUpToThreeDigits, scaleQuantity, sortIngredients } from './portions.ts';

describe('scaleQuantity', () => {
  test.each<[number, number, number, number]>([
    [10, 1, 1, 10],
    [10, 2, 1, 5],
    [10, 5, 1, 2],
    [10, 1, 2, 20],
    [10, 2, 2, 10],
    [10, 5, 10, 20],
  ])('scales %p for a yield of %p to %p portions as %p', (quantity, recipeYield, portions, scaled) => {
    expect(scaleQuantity(quantity, recipeYield, portions)).toBe(scaled);
  });

  test('scales both ends of a range', () => {
    expect(scaleQuantity({ from: 1, to: 2 }, 4, 6)).toEqual({ from: 1.5, to: 3 });
  });

  test('treats a missing or zero yield as one portion', () => {
    expect(scaleQuantity(10, null, 3)).toBe(30);
    expect(scaleQuantity(10, 0, 3)).toBe(30);
  });

  test('rounds to three digits', () => {
    expect(scaleQuantity(1, 3, 1)).toBe(0.333);
    expect(scaleQuantity(1 / 3, 1, 1)).toBe(0.333);
  });

  test('scales to at least one portion', () => {
    expect(scaleQuantity(10, 1, 0)).toBe(10);
  });
});

test('roundUpToThreeDigits', () => {
  expect(roundUpToThreeDigits(1.0005)).toBe(1.001);
  expect(roundUpToThreeDigits(2)).toBe(2);
});

describe('initialPortions', () => {
  test('defaults to the yield, rounded into 1 to 99', () => {
    expect(initialPortions('', 4)).toBe(4);
    expect(initialPortions('', 2.5)).toBe(3);
    expect(initialPortions('', null)).toBe(1);
    expect(initialPortions('', 250)).toBe(99);
  });

  test('takes ?portions= in range', () => {
    expect(initialPortions('?portions=6', 4)).toBe(6);
    expect(initialPortions('?portions=0', 4)).toBe(1);
    expect(initialPortions('?portions=x', 4)).toBe(4);
  });
});

test('clampPortions', () => {
  expect([clampPortions(0), clampPortions(1.4), clampPortions(120)]).toEqual([1, 1, 99]);
});

test('sortIngredients puts quantity and unit first, by unit, then a quantity alone, then neither, and leaves the input alone', () => {
  const line = (raw: string, quantity: number | null, unit: string | null): IngredientDto => ({ raw, quantity, unit, description: raw });
  const input = [line('Salz', null, null), line('4 g Zucker', 4, 'g'), line('1 Banane', 1, null), line('2 EL Öl', 2, 'EL'), line('200 g Nudeln', 200, 'g')];
  expect(sortIngredients(input).map((ingredient) => ingredient.raw)).toEqual(['2 EL Öl', '4 g Zucker', '200 g Nudeln', '1 Banane', 'Salz']);
  expect(input[0]?.raw).toBe('Salz');
});
