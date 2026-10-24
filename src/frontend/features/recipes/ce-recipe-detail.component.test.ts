import { beforeAll, beforeEach, expect, test } from 'bun:test';
import type { RecipeDto } from '../../../shared/dto/recipe.ts';
import { find, mount, openDialog, settle, shadow, testId, useDom, useFetch, useToasts } from '../../testing.ts';
import { NO_NUTRITION, recipe } from './recipes.fixtures.ts';

useDom();
const fake = useFetch();
const toasts = useToasts();

beforeAll(async () => {
  await import('./ce-recipe-detail.component.ts');
  await import('../../ui/confirm/ce-confirm-dialog.component.ts');
});

beforeEach(() => {
  history.replaceState(null, '', '/recipes/12');
});

const FULL: RecipeDto = recipe({
  id: 12,
  title: 'Spaghetti Carbonara',
  flagged: false,
  description: 'Creamy Roman classic',
  source: 'https://www.example.com/carbonara',
  thumbnail: '/thumbnails/carbonara.jpg',
  yield: 4,
  nutrition: { ...NO_NUTRITION, calories: '540 kcal', fat: '20 g' },
  prepTime: 10,
  cookTime: 15,
  totalTime: 25,
  aggregateRating: { value: 4.21, count: 312 },
  rating: 0,
  ingredients: [{ raw: '400 g Spaghetti', quantity: 400, unit: 'g', description: 'Spaghetti' }],
  instructions: ['Boil the pasta.', 'Mix the yolks.'],
  history: ['2026-10-20T18:30:00.000Z'],
  reviews: [{ date: '2024-03-12T10:00:00.000Z', text: 'Great!' }],
  tags: [
    { id: 3, title: 'Italian' },
    { id: 1, title: 'Pasta' },
  ],
});

async function open(dto: RecipeDto = FULL): Promise<ShadowRoot> {
  fake.respondTo(`GET /api/recipes/${dto.id}`, 200, JSON.stringify(dto));
  const view = mount('ce-recipe-detail', { 'recipe-id': String(dto.id) });
  await settle();
  return shadow(view);
}

test('shows every section of a full recipe', async () => {
  const root = await open();
  expect(find(root, testId('title')).textContent.trim()).toBe('Spaghetti Carbonara');
  expect(find(root, testId('source')).getAttribute('href')).toBe('https://www.example.com/carbonara');
  expect(find(root, testId('source')).textContent).toBe('www.example.com ↗');
  expect(find(root, testId('aggregate-rating')).textContent.replaceAll(/\s+/g, ' ').trim()).toBe('Foreign rating 4.21 (312 ratings)');
  expect(Array.from(find(root, testId('tags')).querySelectorAll('a')).map((a) => [a.textContent, a.getAttribute('href')])).toEqual([
    ['Italian', '/?tag=3'],
    ['Pasta', '/?tag=1'],
  ]);
  expect(find(root, testId('description')).textContent).toBe('Creamy Roman classic');
  expect(find(root, testId('thumbnail')).getAttribute('src')).toBe('/thumbnails/carbonara.jpg');
  expect(find(root, testId('nutrition')).textContent).toContain('540 kcal');
  expect(find(root, testId('times')).textContent).toContain('25 minutes');
  expect(find(root, testId('history')).querySelectorAll('li')).toHaveLength(1);
  expect(root.querySelector(testId('ingredients'))).not.toBeNull();
  expect(root.querySelectorAll(testId('step'))).toHaveLength(2);
  expect(find(root, testId('reviews')).textContent).toContain('Great!');
  expect(find(root, testId('rating-value')).textContent).toBe('Not rated yet');
});

test('hides the sections a bare recipe has nothing for', async () => {
  const root = await open(recipe({ id: 5 }));
  for (const id of ['source', 'aggregate-rating', 'tags', 'description', 'thumbnail', 'nutrition', 'ingredients', 'instructions', 'reviews']) {
    expect({ id, present: root.querySelector(testId(id)) !== null }).toEqual({ id, present: false });
  }
  expect(find(root, testId('times')).textContent).toContain('No times have been set');
  expect(find(root, testId('history')).textContent).toContain('Not cooked yet.');
});

test('shows a source that is no URL as text', async () => {
  const root = await open(recipe({ id: 5, source: 'Grandma' }));
  expect(root.querySelector(testId('source'))).toBeNull();
  expect(find(root, testId('source-text')).textContent).toBe('Grandma');
});

test('flags in place, without re-rendering', async () => {
  const root = await open();
  const ingredients = find(root, testId('ingredients'));
  fake.respondTo('PATCH /api/recipes/12', 200, JSON.stringify({ ...FULL, flagged: true }));
  find<HTMLButtonElement>(root, testId('flag')).click();
  await settle();
  expect(fake.sent('PATCH /api/recipes/12')).toEqual([{ flagged: true }]);
  expect(find(root, testId('flag')).textContent.trim()).toBe('Remove flag');
  expect(find<HTMLElement>(root, testId('flag-mark')).hidden).toBe(false);
  expect(find(root, testId('ingredients'))).toBe(ingredients);
});

test('rates in place and shows the cooking the first rating records', async () => {
  const root = await open({ ...FULL, history: [] });
  fake.respondTo('PATCH /api/recipes/12', 200, JSON.stringify({ ...FULL, rating: 4.5, history: ['2026-10-23T18:00:00.000Z'] }));
  find(root, testId('rating')).dispatchEvent(new CustomEvent('rating-change', { detail: 4.5, bubbles: true, composed: true }));
  await settle();
  expect(fake.sent('PATCH /api/recipes/12')).toEqual([{ rating: 4.5 }]);
  expect(find(root, testId('rating')).getAttribute('value')).toBe('4.5');
  expect(find(root, testId('rating-value')).textContent).toBe('4.5');
  expect(find(root, testId('history')).querySelectorAll('li')).toHaveLength(1);
});

test('deletes after confirming, then goes to the list with a toast', async () => {
  const root = await open();
  fake.respondTo('DELETE /api/recipes/12', 204);
  find<HTMLButtonElement>(root, testId('delete')).click();
  const dialog = openDialog();
  expect(find(dialog, testId('title')).textContent).toBe('Delete "Spaghetti Carbonara"?');
  find<HTMLButtonElement>(dialog, testId('confirm')).click();
  await settle();
  expect(fake.sent('DELETE /api/recipes/12')).toHaveLength(1);
  expect(location.pathname).toBe('/');
  expect(toasts).toEqual(['The Recipe has been deleted successfully.']);
});

test('keeps the recipe when the deletion is canceled', async () => {
  const root = await open();
  find<HTMLButtonElement>(root, testId('delete')).click();
  find<HTMLButtonElement>(openDialog(), testId('cancel')).click();
  await settle();
  expect(fake.sent('DELETE /api/recipes/12')).toHaveLength(0);
  expect(location.pathname).toBe('/recipes/12');
});

test('names itself after the recipe', async () => {
  const root = await open();
  const view = root.host;
  expect(view instanceof HTMLElement && 'pageTitle' in view ? view.pageTitle : null).toBe('Spaghetti Carbonara');
});
