import { expect, test } from 'bun:test';
import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dir, '..', '..');

test('AGENTS.md lists every document in docs/', async () => {
  const agents = await Bun.file(resolve(ROOT, 'AGENTS.md')).text();
  const documents = readdirSync(resolve(ROOT, 'docs')).filter((name) => name.endsWith('.md'));
  expect(documents.length).toBeGreaterThan(0);
  for (const name of documents) {
    expect({ name, listed: agents.includes(`docs/${name}`) }).toEqual({ name, listed: true });
  }
});
