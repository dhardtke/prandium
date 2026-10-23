import { describe, expect, test } from 'bun:test';
import { readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { RecipePageDto } from '../shared/dto/recipe.ts';
import type { TagDto } from '../shared/dto/tag.ts';
import { body, useServer } from '../backend/testing.ts';
import { seed } from './seed.ts';

describe('seed', () => {
  const { api, db, configDir } = useServer();

  test('replaces whatever was there with sample recipes, tags and thumbnails', async () => {
    db().run("INSERT INTO recipe (title) VALUES ('Leftover')");
    writeFileSync(join(configDir(), 'thumbnails', 'leftover.png'), '');

    const count = await seed(db(), {
      host: '127.0.0.1',
      port: 0,
      configDir: configDir(),
      passwordHash: null,
      dev: false,
      importConcurrency: 1,
      userAgent: 'test',
    });

    const page = await body<RecipePageDto>(await api('/api/recipes?limit=200'));
    expect(page.total).toBe(count);
    expect(count).toBeGreaterThanOrEqual(25);
    expect(page.items.some((item) => item.title === 'Leftover')).toBe(false);
    const files = readdirSync(join(configDir(), 'thumbnails'));
    expect(files).not.toContain('leftover.png');
    expect(files.length).toBeGreaterThan(5);
    const withThumbnail = page.items.find((item) => item.thumbnail !== null);
    expect((await api(withThumbnail?.thumbnail ?? '')).status).toBe(200);
    expect((await body<TagDto[]>(await api('/api/tags'))).length).toBeGreaterThan(10);
    expect(page.items.some((item) => item.cookedCount > 0)).toBe(true);
  });
});
