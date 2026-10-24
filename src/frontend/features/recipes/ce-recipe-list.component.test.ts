import { beforeAll, beforeEach, expect, test } from 'bun:test';
import type { RecipePageDto } from '../../../shared/dto/recipe.ts';
import type { TagDto } from '../../../shared/dto/tag.ts';
import { choose, find, mount, openDialog, settle, shadow, submit, testId, type, useDom, useFetch, useToasts } from '../../testing.ts';
import { recipePage, summary, tag } from './recipes.fixtures.ts';

useDom();
const fake = useFetch();
const toasts = useToasts();

beforeAll(async () => {
  await import('./ce-recipe-list.component.ts');
  await import('../../ui/confirm/ce-confirm-dialog.component.ts');
});

beforeEach(() => {
  history.replaceState(null, '', '/');
});

const LIST = '/api/recipes?limit=24&offset=0&sort=title&order=asc';

function respond(recipes: RecipePageDto, tags: TagDto[] = [], query = LIST, tagQuery = '/api/tags'): void {
  fake.respondTo(`GET ${query}`, 200, JSON.stringify(recipes));
  fake.respondTo(`GET ${tagQuery}`, 200, JSON.stringify(tags));
}

async function mountList(): Promise<ShadowRoot> {
  const view = mount('ce-recipe-list');
  await settle();
  return shadow(view);
}

function cardTitles(root: ShadowRoot): string[] {
  return Array.from(root.querySelectorAll('ce-recipe-card')).map((card) => find(shadow(card), testId('open')).textContent.trim());
}

function panel(root: ShadowRoot): ShadowRoot {
  return shadow(find(root, testId('tag-panel')));
}

test('loads the first page sorted by title and shows the cards and the count', async () => {
  respond(recipePage([summary({ id: 1, title: 'Carbonara' }), summary({ id: 2, title: 'Ramen' })], { total: 2 }));
  const root = await mountList();
  expect(cardTitles(root)).toEqual(['Carbonara', 'Ramen']);
  expect(find(root, testId('count')).textContent).toBe('2 Recipes');
  expect(root.querySelector(testId('pagination'))).toBeNull();
});

test('says so when nothing matches', async () => {
  respond(recipePage([]));
  const root = await mountList();
  expect(find(root, testId('empty')).textContent).toContain('No recipes have been found');
});

test('reads the query string, old names included, into its first request', async () => {
  history.replaceState(null, '', '/?title=pasta&tagId=3&orderBy=rating&order=DESC&page=2');
  respond(recipePage([], { total: 30 }), [tag({ id: 3 })], '/api/recipes?limit=24&offset=24&search=pasta&tag=3&sort=rating&order=desc', '/api/tags?selected=3');
  const root = await mountList();
  expect(find<HTMLInputElement>(root, testId('search')).value).toBe('pasta');
  expect(find<HTMLSelectElement>(root, testId('sort')).value).toBe('rating');
  expect(find(root, testId('order')).getAttribute('aria-label')).toBe('Switch to ascending order');
  expect(find(panel(root), testId('tag-3')).getAttribute('aria-pressed')).toBe('true');
});

test('searches on Enter: pushes the URL and patches the results, keeping the search field', async () => {
  respond(recipePage([summary({ title: 'Carbonara' })]));
  const root = await mountList();
  const field = find<HTMLInputElement>(root, testId('search'));
  respond(recipePage([summary({ id: 9, title: 'Ramen' })]), [], '/api/recipes?limit=24&offset=0&search=ramen&sort=title&order=asc');
  field.value = ' ramen ';
  submit(find(root, 'form[data-action="search"]'));
  await settle();
  expect(location.pathname + location.search).toBe('/?search=ramen');
  expect(cardTitles(root)).toEqual(['Ramen']);
  expect(find(root, testId('search'))).toBe(field);
});

test('searches 300 ms after typing stops', async () => {
  respond(recipePage([]));
  const root = await mountList();
  respond(recipePage([]), [], '/api/recipes?limit=24&offset=0&search=pho&sort=title&order=asc');
  type(find<HTMLInputElement>(root, testId('search')), 'ph');
  type(find<HTMLInputElement>(root, testId('search')), 'pho');
  await settle(100);
  expect(fake.sent('GET /api/recipes?limit=24&offset=0&search=pho&sort=title&order=asc')).toHaveLength(0);
  await settle(350);
  expect(fake.sent('GET /api/recipes?limit=24&offset=0&search=pho&sort=title&order=asc')).toHaveLength(1);
  expect(location.search).toBe('?search=pho');
});

test('sorts by the chosen key and flips the order, back on page 1', async () => {
  history.replaceState(null, '', '/?page=2');
  respond(recipePage([], { total: 30 }), [], '/api/recipes?limit=24&offset=24&sort=title&order=asc');
  const root = await mountList();
  respond(recipePage([]), [], '/api/recipes?limit=24&offset=0&sort=total_time&order=asc');
  choose(find<HTMLSelectElement>(root, testId('sort')), 'total_time');
  await settle();
  expect(location.search).toBe('?sort=total_time');
  respond(recipePage([]), [], '/api/recipes?limit=24&offset=0&sort=total_time&order=desc');
  find<HTMLButtonElement>(root, testId('order')).click();
  await settle();
  expect(location.search).toBe('?sort=total_time&order=desc');
  expect(find(root, testId('order')).textContent).toBe('↑');
});

test('toggles a tag into the filter and out again, and clears all', async () => {
  respond(recipePage([]), [tag({ id: 1, title: 'Pasta' }), tag({ id: 2, title: 'Quick' })]);
  const root = await mountList();
  respond(
    recipePage([]),
    [tag({ id: 1, title: 'Pasta' }), tag({ id: 2, title: 'Quick' })],
    '/api/recipes?limit=24&offset=0&tag=2&sort=title&order=asc',
    '/api/tags?selected=2',
  );
  find<HTMLButtonElement>(panel(root), testId('tag-2')).click();
  await settle();
  expect(location.search).toBe('?tag=2');
  expect(find(panel(root), testId('tag-2')).getAttribute('aria-pressed')).toBe('true');
  expect(find(panel(root), testId('summary')).textContent).toBe('Tags (1 selected)');
  respond(recipePage([]), [tag({ id: 1, title: 'Pasta' }), tag({ id: 2, title: 'Quick' })]);
  find<HTMLButtonElement>(panel(root), testId('clear')).click();
  await settle();
  expect(location.search).toBe('');
  expect(find(panel(root), testId('tag-2')).getAttribute('aria-pressed')).toBe('false');
});

test('pages through ce-pagination', async () => {
  respond(recipePage([summary()], { total: 50 }));
  const root = await mountList();
  respond(recipePage([summary({ id: 2, title: 'Ramen' })], { total: 50, offset: 24 }), [], '/api/recipes?limit=24&offset=24&sort=title&order=asc');
  find(root, testId('pagination')).dispatchEvent(new CustomEvent('page-change', { detail: 2, bubbles: true, composed: true }));
  await settle();
  expect(location.search).toBe('?page=2');
  expect(cardTitles(root)).toEqual(['Ramen']);
});

test('keeps the open tag panel in the URL without a request', async () => {
  respond(recipePage([]), [tag()]);
  const root = await mountList();
  const requests = fake.requests.length;
  const details = find<HTMLDetailsElement>(panel(root), testId('details'));
  details.open = true;
  details.dispatchEvent(new Event('toggle'));
  await settle();
  expect(location.search).toBe('?tags');
  expect(fake.requests).toHaveLength(requests);
});

test('links New recipe and Import', async () => {
  respond(recipePage([]));
  const root = await mountList();
  expect(find(root, testId('new')).getAttribute('href')).toBe('/recipes/new');
  expect(find(root, testId('import')).getAttribute('href')).toBe('/recipes/import');
});

test('deletes a recipe from its card menu after confirming, then reloads the page', async () => {
  respond(recipePage([summary({ id: 1, title: 'Carbonara' }), summary({ id: 2, title: 'Ramen' })]));
  const root = await mountList();
  fake.respondTo('DELETE /api/recipes/2', 204);
  respond(recipePage([summary({ id: 1, title: 'Carbonara' })]));
  find<HTMLButtonElement>(shadow(find(root, testId('card-2'))), testId('delete')).click();
  const dialog = openDialog();
  expect(find(dialog, testId('title')).textContent).toBe('Delete "Ramen"?');
  find<HTMLButtonElement>(dialog, testId('confirm')).click();
  await settle();
  expect(fake.sent('DELETE /api/recipes/2')).toHaveLength(1);
  expect(cardTitles(root)).toEqual(['Carbonara']);
  expect(toasts).toEqual(['The Recipe has been deleted successfully.']);
});

test('keeps a recipe whose deletion is canceled', async () => {
  respond(recipePage([summary({ id: 2, title: 'Ramen' })]));
  const root = await mountList();
  find<HTMLButtonElement>(shadow(find(root, testId('card-2'))), testId('delete')).click();
  find<HTMLButtonElement>(openDialog(), testId('cancel')).click();
  await settle();
  expect(fake.sent('DELETE /api/recipes/2')).toHaveLength(0);
});
