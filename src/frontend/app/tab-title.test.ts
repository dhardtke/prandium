import { expect, test } from 'bun:test';
import { APP_TITLE, tabTitle } from './tab-title.ts';

test('names a page before the app', () => {
  expect(tabTitle('Recipes')).toBe('Recipes · Prandium');
});

test('falls back to the app title for no name', () => {
  expect(tabTitle(null)).toBe(APP_TITLE);
});

test('the app title matches the <title> in index.html', async () => {
  const html = await Bun.file(`${import.meta.dir}/../index.html`).text();
  expect(/<title>([^<]*)<\/title>/.exec(html)?.[1]).toBe(APP_TITLE);
});
