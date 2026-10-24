import { expect, test } from 'bun:test';
import { LANGUAGE_STORAGE_KEY, THEME_STORAGE_KEY } from './storage-keys.ts';

test('match the keys the inline script in index.html reads', async () => {
  const html = await Bun.file(`${import.meta.dir}/../index.html`).text();
  const script = /<script>([\s\S]*?)<\/script>/.exec(html)?.[1] ?? '';
  expect(script).toContain(`localStorage.getItem('${THEME_STORAGE_KEY}')`);
  expect(script).toContain(`localStorage.getItem('${LANGUAGE_STORAGE_KEY}')`);
});
