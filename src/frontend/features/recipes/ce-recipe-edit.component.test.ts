import { beforeAll, beforeEach, expect, test } from 'bun:test';
import type { RecipeDto } from '../../../shared/dto/recipe.ts';
import { find, mount, openDialog, settle, shadow, submit, testId, type, useDom, useFetch, useToasts } from '../../testing.ts';
import type * as LeaveGuard from '../../ui/leave-guard.ts';
import { NO_NUTRITION, recipe, tag } from './recipes.fixtures.ts';
import type { CeRecipeEditComponent } from './ce-recipe-edit.component.ts';

useDom();
const fake = useFetch();
const toasts = useToasts();
let leaveGuard: typeof LeaveGuard;

beforeAll(async () => {
  // Oat's taginput, as far as the view relies on it: a `value` of strings or objects, strings split on commas.
  if (!customElements.get('ot-taginput')) {
    customElements.define(
      'ot-taginput',
      class extends HTMLElement {
        #tags: unknown[] = [];

        get value(): unknown[] {
          return this.#tags;
        }

        set value(tags: unknown[]) {
          this.#tags = tags.flatMap((tag) => (typeof tag === 'string' ? tag.split(',') : [tag]));
        }
      },
    );
  }
  await import('./ce-recipe-edit.component.ts');
  await import('../../ui/confirm/ce-confirm-dialog.component.ts');
  leaveGuard = await import('../../ui/leave-guard.ts');
});

beforeEach(() => {
  history.replaceState(null, '', '/recipes/12/edit');
});

const CARBONARA: RecipeDto = recipe({
  id: 12,
  title: 'Carbonara',
  description: 'Creamy',
  source: 'https://example.com/c',
  yield: 4,
  nutrition: { ...NO_NUTRITION, fat: '20 g' },
  prepTime: 10,
  cookTime: 15,
  totalTime: 25,
  aggregateRating: { value: 4.2, count: 10 },
  rating: 4.5,
  ingredients: [
    { raw: 'Salt', quantity: null, unit: null, description: 'Salt' },
    { raw: '400 g Spaghetti', quantity: 400, unit: 'g', description: 'Spaghetti' },
  ],
  instructions: ['Boil.', 'Mix.'],
  history: ['2026-10-20T18:30:00.000Z'],
  tags: [
    { id: 1, title: 'Pasta' },
    { id: 2, title: 'Salt, pepper' },
  ],
});

async function open(dto: RecipeDto | null = CARBONARA): Promise<CeRecipeEditComponent> {
  fake.respondTo('GET /api/tags', 200, JSON.stringify([tag({ title: 'Pasta' }), tag({ id: 3, title: 'Quick' })]));
  if (dto) {
    fake.respondTo(`GET /api/recipes/${dto.id}`, 200, JSON.stringify(dto));
  }
  const view = mount<CeRecipeEditComponent>('ce-recipe-edit', dto ? { 'recipe-id': String(dto.id) } : {});
  await settle();
  return view;
}

function input(view: CeRecipeEditComponent, id: string): HTMLInputElement {
  return find<HTMLInputElement>(shadow(view), testId(id));
}

function tagsOf(view: CeRecipeEditComponent): unknown[] {
  const element = find(shadow(view), testId('tags'));
  const value: unknown = Reflect.get(element, 'value');
  return Array.isArray(value) ? value.map(String) : [];
}

test('fills the form from the recipe, ingredients in their stored order', async () => {
  const view = await open();
  expect(input(view, 'title').value).toBe('Carbonara');
  expect(find<HTMLTextAreaElement>(shadow(view), testId('description')).value).toBe('Creamy');
  expect(input(view, 'yield').value).toBe('4');
  expect(input(view, 'rating').value).toBe('4.5');
  const ingredients = find(shadow(view), testId('ingredients'));
  expect(Reflect.get(ingredients, 'value')).toEqual(['Salt', '400 g Spaghetti']);
  expect(Array.from(shadow(view).querySelectorAll('datalist option')).map((option) => option.getAttribute('value'))).toEqual(['Pasta', 'Quick']);
});

test('hands the taginput tag objects, so a tag with a comma stays whole', async () => {
  const view = await open();
  expect(tagsOf(view)).toEqual(['Pasta', 'Salt, pepper']);
});

test('is clean until something changes', async () => {
  const view = await open();
  expect(view.isDirty()).toBe(false);
  type(input(view, 'title'), 'Carbonara!');
  expect(view.isDirty()).toBe(true);
});

test('saves every field through PATCH, then opens the recipe with a toast', async () => {
  const view = await open();
  type(input(view, 'title'), 'Spaghetti Carbonara');
  fake.respondTo('PATCH /api/recipes/12', 200, JSON.stringify({ ...CARBONARA, title: 'Spaghetti Carbonara' }));
  submit(find(shadow(view), testId('form')));
  await settle();
  expect(fake.sent('PATCH /api/recipes/12')).toEqual([
    {
      title: 'Spaghetti Carbonara',
      flagged: false,
      description: 'Creamy',
      source: 'https://example.com/c',
      yield: 4,
      nutrition: { ...NO_NUTRITION, fat: '20 g' },
      prepTime: 10,
      cookTime: 15,
      aggregateRating: { value: 4.2, count: 10 },
      rating: 4.5,
      ingredients: ['Salt', '400 g Spaghetti'],
      instructions: ['Boil.', 'Mix.'],
      history: ['2026-10-20T18:30:00.000Z'],
      tags: ['Pasta', 'Salt, pepper'],
    },
  ]);
  expect(location.pathname).toBe('/recipes/12');
  expect(toasts).toEqual(['Recipe saved']);
});

test('creates a new recipe with POST, then uploads the chosen image with PUT', async () => {
  history.replaceState(null, '', '/recipes/new');
  const view = await open(null);
  type(input(view, 'title'), 'Ramen');
  const file = new File([new Uint8Array([1, 2, 3])], 'ramen.png', { type: 'image/png' });
  const picker = input(view, 'file');
  Object.defineProperty(picker, 'files', { configurable: true, value: [file] });
  picker.dispatchEvent(new Event('change', { bubbles: true }));
  fake.respondTo('POST /api/recipes', 201, JSON.stringify(recipe({ id: 30, title: 'Ramen' })));
  fake.respondTo('PUT /api/recipes/30/thumbnail', 200, JSON.stringify(recipe({ id: 30, title: 'Ramen', thumbnail: '/thumbnails/ramen.png' })));
  submit(find(shadow(view), testId('form')));
  await settle();
  expect(fake.requests.filter((request) => request.method !== 'GET').map((request) => `${request.method} ${request.url}`)).toEqual([
    'POST /api/recipes',
    'PUT /api/recipes/30/thumbnail',
  ]);
  expect(fake.sent('PUT /api/recipes/30/thumbnail')).toEqual([file]);
  expect(location.pathname).toBe('/recipes/30');
});

test('refuses a file that is no image', async () => {
  const view = await open();
  const picker = input(view, 'file');
  Object.defineProperty(picker, 'files', { configurable: true, value: [new File(['x'], 'notes.txt', { type: 'text/plain' })] });
  picker.dispatchEvent(new Event('change', { bubbles: true }));
  expect(toasts).toEqual(['Please make sure you select an image.']);
  expect(view.isDirty()).toBe(false);
});

test('removes the thumbnail with DELETE when asked', async () => {
  const view = await open({ ...CARBONARA, thumbnail: '/thumbnails/c.jpg' });
  find<HTMLButtonElement>(shadow(view), testId('remove-thumbnail')).click();
  expect(find<HTMLImageElement>(shadow(view), testId('preview')).getAttribute('src')).toBe('/ui/placeholder.svg');
  fake.respondTo('PATCH /api/recipes/12', 200, JSON.stringify({ ...CARBONARA, thumbnail: '/thumbnails/c.jpg' }));
  fake.respondTo('DELETE /api/recipes/12/thumbnail', 200, JSON.stringify(CARBONARA));
  submit(find(shadow(view), testId('form')));
  await settle();
  expect(fake.sent('DELETE /api/recipes/12/thumbnail')).toHaveLength(1);
});

test('keeps the values and toasts the message when the server refuses', async () => {
  const view = await open();
  type(input(view, 'title'), 'Changed');
  fake.respondTo('PATCH /api/recipes/12', 400, JSON.stringify({ error: '"rating" must be between 0 and 5' }));
  submit(find(shadow(view), testId('form')));
  await settle();
  expect(toasts).toEqual(['"rating" must be between 0 and 5']);
  expect(input(view, 'title').value).toBe('Changed');
  expect(location.pathname).toBe('/recipes/12/edit');
  expect(view.isDirty()).toBe(true);
});

test('asks before leaving only when dirty, and lets the navigation through once confirmed', async () => {
  const view = await open();
  expect(await leaveGuard.confirmLeave()).toBe(true);
  type(input(view, 'title'), 'Changed');
  const answer = leaveGuard.confirmLeave();
  const dialog = openDialog();
  expect(find(dialog, testId('title')).textContent).toBe('Discard changes?');
  find<HTMLButtonElement>(dialog, testId('cancel')).click();
  expect(await answer).toBe(false);
  const again = leaveGuard.confirmLeave();
  find<HTMLButtonElement>(openDialog(), testId('confirm')).click();
  expect(await again).toBe(true);
  expect(leaveGuard.hasUnsavedChanges()).toBe(false);
});

test('stops guarding once removed', async () => {
  const view = await open();
  type(input(view, 'title'), 'Changed');
  view.remove();
  expect(leaveGuard.hasUnsavedChanges()).toBe(false);
});

test('names the recipe in the breadcrumb above Edit', async () => {
  const view = await open();
  expect(view.pageTitle).toBe('Edit');
  expect(view.pageParents).toEqual([
    { path: '/', label: 'Recipes' },
    { path: '/recipes/12', label: 'Carbonara' },
  ]);
});
