import { describe, expect, test } from 'bun:test';
import type { TagDto } from '../../../shared/dto/tag.ts';
import { body, useServer } from '../../testing.ts';
import { createRecipe } from '../recipes/recipes.fixtures.ts';

const { api, post } = useServer();

async function tags(query = ''): Promise<[string, number][]> {
  const res = await api(`/api/tags${query}`);
  expect(res.status).toBe(200);
  return (await body<TagDto[]>(res)).map((tag) => [tag.title, tag.recipeCount]);
}

async function idOf(title: string): Promise<number> {
  const tag = (await body<TagDto[]>(await api('/api/tags'))).find((candidate) => candidate.title === title);
  if (!tag) {
    throw new Error(`no tag ${title}`);
  }
  return tag.id;
}

describe('GET /api/tags', () => {
  test('lists nothing without recipes', async () => {
    expect(await tags()).toEqual([]);
  });

  test('lists every tag by title with the number of its recipes', async () => {
    await createRecipe(post, { tags: ['Quick', 'Pasta'] });
    await createRecipe(post, { tags: ['Pasta'] });
    await createRecipe(post, { tags: ['Soup'] });
    expect(await tags()).toEqual([
      ['Pasta', 2],
      ['Quick', 1],
      ['Soup', 1],
    ]);
  });

  test('counts only the recipes that carry every selected tag, keeping the others at 0', async () => {
    await createRecipe(post, { tags: ['Pasta', 'Quick', 'Vegetarian'] });
    await createRecipe(post, { tags: ['Pasta', 'Quick'] });
    await createRecipe(post, { tags: ['Pasta'] });
    await createRecipe(post, { tags: ['Soup'] });
    const pasta = await idOf('Pasta');
    const quick = await idOf('Quick');
    expect(await tags(`?selected=${pasta}`)).toEqual([
      ['Pasta', 3],
      ['Quick', 2],
      ['Soup', 0],
      ['Vegetarian', 1],
    ]);
    expect(await tags(`?selected=${pasta}&selected=${quick}`)).toEqual([
      ['Pasta', 2],
      ['Quick', 2],
      ['Soup', 0],
      ['Vegetarian', 1],
    ]);
  });

  test('refuses a selected id that is no id', async () => {
    expect((await api('/api/tags?selected=abc')).status).toBe(400);
  });
});
