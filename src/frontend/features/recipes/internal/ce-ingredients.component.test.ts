import { beforeAll, beforeEach, expect, test } from 'bun:test';
import type { IngredientDto } from '../../../../shared/dto/recipe.ts';
import { find, mount, shadow, testId, useDom } from '../../../testing.ts';
import type { CeIngredientsComponent } from './ce-ingredients.component.ts';

useDom();

beforeAll(async () => {
  await import('./ce-ingredients.component.ts');
});

beforeEach(() => {
  history.replaceState(null, '', '/recipes/1');
});

const INGREDIENTS: IngredientDto[] = [
  { raw: 'Salz', quantity: null, unit: null, description: 'Salz' },
  { raw: '4 Eigelb', quantity: 4, unit: null, description: 'Eigelb' },
  { raw: '400 g Spaghetti', quantity: 400, unit: 'g', description: 'Spaghetti' },
  { raw: '1-2 TL Pfeffer', quantity: { from: 1, to: 2 }, unit: 'TL', description: 'Pfeffer' },
];

function mountIngredients(recipeYield: number | null = 4): ShadowRoot {
  const element = mount<CeIngredientsComponent>('ce-ingredients');
  element.recipe = { ingredients: INGREDIENTS, yield: recipeYield };
  return shadow(element);
}

function rows(root: ShadowRoot): string[] {
  return Array.from(root.querySelectorAll(testId('ingredient'))).map(
    (row) => `${row.querySelector(testId('amount'))?.textContent.trim()}|${row.querySelector(testId('description'))?.textContent.trim()}`,
  );
}

test('lists the ingredients sorted for cooking, unscaled at the yield', () => {
  const root = mountIngredients();
  expect(find<HTMLInputElement>(root, testId('portions')).value).toBe('4');
  expect(rows(root)).toEqual(['400 g|Spaghetti', '1–2 TL|Pfeffer', '4|Eigelb', '|Salz']);
});

test('scales with the portions buttons and keeps them in the URL', () => {
  const root = mountIngredients();
  find<HTMLButtonElement>(root, testId('more')).click();
  find<HTMLButtonElement>(root, testId('more')).click();
  expect(rows(root)).toEqual(['600 g|Spaghetti', '1.5–3 TL|Pfeffer', '6|Eigelb', '|Salz']);
  expect(location.search).toBe('?portions=6');
  find<HTMLButtonElement>(root, testId('less')).click();
  expect(find<HTMLInputElement>(root, testId('portions')).value).toBe('5');
});

test('scales when a number is typed, clamped to 1 to 99', () => {
  const root = mountIngredients();
  const input = find<HTMLInputElement>(root, testId('portions'));
  input.value = '200';
  input.dispatchEvent(new Event('change', { bubbles: true }));
  expect(input.value).toBe('99');
  expect(find<HTMLButtonElement>(root, testId('more')).disabled).toBe(true);
  input.value = '0';
  input.dispatchEvent(new Event('change', { bubbles: true }));
  expect(input.value).toBe('1');
  expect(find<HTMLButtonElement>(root, testId('less')).disabled).toBe(true);
  expect(rows(root)[0]).toBe('100 g|Spaghetti');
});

test('starts from ?portions=', () => {
  history.replaceState(null, '', '/recipes/1?portions=2');
  expect(rows(mountIngredients())[0]).toBe('200 g|Spaghetti');
});

test('scales a recipe without a yield from one portion', () => {
  const root = mountIngredients(null);
  expect(find<HTMLInputElement>(root, testId('portions')).value).toBe('1');
  expect(rows(root)[0]).toBe('400 g|Spaghetti');
});
