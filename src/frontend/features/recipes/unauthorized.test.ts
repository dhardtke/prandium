import { afterEach, beforeAll, beforeEach, expect, test } from 'bun:test';
import { find, mount, settle, shadow, submit, testId, useDom, useFetch, useToasts } from '../../testing.ts';
import { UNAUTHORIZED_EVENT } from '../../http/errors.ts';

useDom();
const fake = useFetch();
const toasts = useToasts();

beforeAll(async () => {
  await Promise.all([
    import('./ce-recipe-list.component.ts'),
    import('./ce-recipe-detail.component.ts'),
    import('./ce-recipe-edit.component.ts'),
    import('./ce-recipe-import.component.ts'),
  ]);
});

let signals = 0;
const count = (): void => {
  signals++;
};

beforeEach(() => {
  signals = 0;
  window.addEventListener(UNAUTHORIZED_EVENT, count);
  fake.respondWith(401, JSON.stringify({ error: 'Not logged in' }));
});

afterEach(() => {
  window.removeEventListener(UNAUTHORIZED_EVENT, count);
});

// ce-app answers the signal with /login?next=…, which ce-app.component.test.ts covers.
test.each([
  ['the list', 'ce-recipe-list', {}],
  ['the detail page', 'ce-recipe-detail', { 'recipe-id': '12' }],
  ['the edit page', 'ce-recipe-edit', { 'recipe-id': '12' }],
  ['the new-recipe page', 'ce-recipe-edit', {}],
])('%s sends a 401 to the login, without an error toast', async (_name, tag, attributes) => {
  mount(tag, attributes);
  await settle();
  expect(signals).toBeGreaterThanOrEqual(1);
  expect(toasts).toEqual([]);
});

test('the import page sends a 401 to the login, without an error toast', async () => {
  const root = shadow(mount('ce-recipe-import'));
  find<HTMLTextAreaElement>(root, testId('urls')).value = 'https://example.com/a';
  submit(find(root, testId('form')));
  await settle();
  expect(signals).toBe(1);
  expect(toasts).toEqual([]);
});
