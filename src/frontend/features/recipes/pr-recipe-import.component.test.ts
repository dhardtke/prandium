import { beforeAll, expect, test } from 'bun:test';
import type { ImportResultDto } from '../../../shared/dto/recipe.ts';
import { find, mount, settle, shadow, submit, testId, useDom, useFetch, useToasts } from '../../testing.ts';

useDom();
const fake = useFetch();
const toasts = useToasts();

beforeAll(async () => {
  await import('./pr-recipe-import.component.ts');
});

const RESULT: ImportResultDto = {
  results: [
    { url: 'https://example.com/a', recipe: { id: 7, title: 'Ramen' }, error: null },
    { url: 'https://example.com/b', recipe: null, error: 'No schema.org recipe found' },
  ],
};

async function importLines(text: string): Promise<ShadowRoot> {
  const root = shadow(mount('pr-recipe-import'));
  find<HTMLTextAreaElement>(root, testId('urls')).value = text;
  submit(find(root, testId('form')));
  await settle();
  return root;
}

test('sends one URL per line, blank lines dropped', async () => {
  fake.respondTo('POST /api/recipes/import', 200, JSON.stringify(RESULT));
  await importLines(' https://example.com/a \n\n https://example.com/b\n');
  expect(fake.sent('POST /api/recipes/import')).toEqual([{ urls: ['https://example.com/a', 'https://example.com/b'] }]);
});

test('lists the results in order, linking an imported recipe and naming a failure', async () => {
  fake.respondTo('POST /api/recipes/import', 200, JSON.stringify(RESULT));
  const root = await importLines('https://example.com/a\nhttps://example.com/b');
  const rows = Array.from(root.querySelectorAll(testId('result')));
  expect(rows).toHaveLength(2);
  expect(rows[0]?.querySelector(testId('open'))?.getAttribute('href')).toBe('/recipes/7');
  expect(rows[1]?.querySelector(testId('error'))?.textContent).toBe('✗ No schema.org recipe found');
  expect(toasts).toEqual(['The URLs have been processed. Please find the results below.']);
});

test('sends nothing for blank input', async () => {
  await importLines('  \n ');
  expect(fake.sent('POST /api/recipes/import')).toEqual([]);
});

test('toasts a refused request and keeps the input', async () => {
  fake.respondTo('POST /api/recipes/import', 400, JSON.stringify({ error: '"ftp://x" is no http(s) URL' }));
  const root = await importLines('ftp://x');
  expect(toasts).toEqual(['"ftp://x" is no http(s) URL']);
  expect(find<HTMLTextAreaElement>(root, testId('urls')).value).toBe('ftp://x');
  expect(root.querySelectorAll(testId('result'))).toHaveLength(0);
});
