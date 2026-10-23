import { beforeAll, expect, test } from 'bun:test';
import { collect, find, mount, shadow, testId, useDom } from '../../../testing.ts';
import { summary } from '../recipes.fixtures.ts';
import type { PrRecipeCardComponent } from './pr-recipe-card.component.ts';

useDom();

beforeAll(async () => {
  await import('./pr-recipe-card.component.ts');
});

function card(overrides: Parameters<typeof summary>[0] = {}): ShadowRoot {
  const element = mount<PrRecipeCardComponent>('pr-recipe-card');
  element.recipe = summary(overrides);
  return shadow(element);
}

test('links the whole card to the recipe and shows the placeholder without a thumbnail', () => {
  const root = card({ id: 7, title: 'Ramen' });
  expect(find(root, testId('open')).getAttribute('href')).toBe('/recipes/7');
  expect(find(root, testId('open')).textContent.trim()).toBe('Ramen');
  expect(find(root, testId('thumbnail')).getAttribute('src')).toBe('/ui/placeholder.svg');
  expect(root.querySelector(testId('description'))).toBeNull();
});

test('shows the thumbnail, the description, when it was last cooked and the stats', () => {
  const root = card({
    thumbnail: '/thumbnails/ramen.jpg',
    description: 'Rich broth',
    cookedCount: 5,
    rating: 4.5,
    aggregateRating: { value: 4.21, count: 312 },
    totalTime: 35,
    lastCookedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  });
  expect(find(root, testId('thumbnail')).getAttribute('src')).toBe('/thumbnails/ramen.jpg');
  expect(find(root, testId('description')).textContent).toBe('Rich broth');
  expect(find(root, testId('cooked')).textContent.trim()).toBe('Last cooked 3 days ago.');
  expect(find(root, testId('stats')).textContent).toBe('5× cooked · ★ 4.5 · 👥 4.21 · 35 minutes');
});

test('says when a recipe was never cooked, and leaves unset stats out', () => {
  const root = card();
  expect(find(root, testId('cooked')).textContent.trim()).toBe('Not cooked yet.');
  expect(find(root, testId('stats')).textContent).toBe('0× cooked');
});

test('marks a flagged recipe', () => {
  const root = card({ flagged: true });
  expect(find(root, testId('card')).classList.contains('flagged')).toBe(true);
  expect(root.querySelector(testId('flag'))).not.toBeNull();
});

test('offers Edit as a link and Delete as an event', () => {
  const deletions = collect('recipe-delete');
  const root = card({ id: 7 });
  expect(find(root, testId('edit')).getAttribute('href')).toBe('/recipes/7/edit');
  find<HTMLButtonElement>(root, testId('delete')).click();
  expect(deletions).toMatchObject([{ id: 7 }]);
});

test('escapes the title', () => {
  const root = card({ title: '<b>Ramen</b>' });
  expect(root.querySelector('b')).toBeNull();
});
