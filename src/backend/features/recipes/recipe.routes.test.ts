import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import type { Server } from 'bun';
import { copyFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type { CreateRecipeDto, EditRecipeDto, ImportResultDto, RecipeDto, RecipePageDto, RecipeSortKey } from '../../../shared/dto/recipe.ts';
import type { TagDto } from '../../../shared/dto/tag.ts';
import type { ErrorDto } from '../../../shared/dto/error.ts';
import { at, body, useServer } from '../../testing.ts';
import { RECIPE_SORT_KEYS } from './recipes.facade.ts';
import { createRecipe } from './recipes.fixtures.ts';

const { api, post, patch, del, db, configDir, logs } = useServer();

async function page(query = ''): Promise<RecipePageDto> {
  const res = await api(`/api/recipes${query}`);
  expect(res.status).toBe(200);
  return body<RecipePageDto>(res);
}

async function titles(query = ''): Promise<string[]> {
  return (await page(query)).items.map((item) => item.title);
}

async function refused(dto: Record<string, unknown>): Promise<string> {
  const res = await post('/api/recipes', { title: 'Ramen', ...dto });
  expect(res.status).toBe(400);
  return (await body<ErrorDto>(res)).error;
}

const FULL: CreateRecipeDto = {
  title: 'Spaghetti Carbonara',
  flagged: true,
  description: 'Creamy Roman classic',
  source: 'https://example.com/carbonara',
  yield: 4,
  nutrition: {
    calories: '540 kcal',
    carbohydrate: '60 g',
    cholesterol: '200 mg',
    fat: '20 g',
    fiber: '3 g',
    protein: '25 g',
    saturatedFat: '8 g',
    sodium: '1 g',
    sugar: '2 g',
    transFat: '0 g',
    unsaturatedFat: '10 g',
  },
  prepTime: 10,
  cookTime: 15,
  aggregateRating: { value: 4.21, count: 312 },
  rating: 4.5,
  ingredients: ['4 egg yolks', '400 g Spaghetti', 'Salt'],
  instructions: ['Boil the pasta.', 'Mix the yolks.'],
  history: ['2026-10-01T18:00:00.000Z', '2026-10-20T18:30:00.000Z'],
  tags: ['Pasta', 'Italian'],
};

describe('POST /api/recipes', () => {
  test('creates a recipe from a title alone, with defaults', async () => {
    const recipe = await createRecipe(post, { title: '  Ramen  ' });
    expect(recipe).toMatchObject({
      title: 'Ramen',
      flagged: false,
      description: '',
      source: '',
      thumbnail: null,
      yield: 1,
      prepTime: 0,
      cookTime: 0,
      totalTime: 0,
      aggregateRating: { value: null, count: null },
      rating: 0,
      ingredients: [],
      instructions: [],
      history: [],
      reviews: [],
      tags: [],
    });
    expect(recipe.nutrition.calories).toBeNull();
    expect(Date.parse(recipe.createdAt)).not.toBeNaN();
  });

  test('stores every field and answers it back, history newest first and ingredients parsed', async () => {
    const recipe = await createRecipe(post, FULL);
    expect(recipe).toMatchObject({
      title: FULL.title,
      flagged: true,
      description: FULL.description,
      source: FULL.source,
      yield: 4,
      nutrition: FULL.nutrition,
      prepTime: 10,
      cookTime: 15,
      totalTime: 25,
      aggregateRating: { value: 4.21, count: 312 },
      rating: 4.5,
      instructions: FULL.instructions,
      history: ['2026-10-20T18:30:00.000Z', '2026-10-01T18:00:00.000Z'],
    });
    expect(recipe.ingredients).toEqual([
      { raw: '4 egg yolks', quantity: 4, unit: null, description: 'egg yolks' },
      { raw: '400 g Spaghetti', quantity: 400, unit: 'g', description: 'Spaghetti' },
      { raw: 'Salt', quantity: null, unit: null, description: 'Salt' },
    ]);
    expect(recipe.tags.map((tag) => tag.title)).toEqual(['Italian', 'Pasta']);
  });

  test('trims and drops blank entries, normalizes history and merges tags that differ only in case', async () => {
    const recipe = await createRecipe(post, {
      ingredients: [' Salt ', '', '  '],
      history: ['2026-10-20T20:30:00+02:00', '2026-10-20T18:30:00Z'],
      tags: [' Pasta ', 'pasta', '', 'Quick'],
    });
    expect(recipe.ingredients.map((ingredient) => ingredient.raw)).toEqual(['Salt']);
    expect(recipe.history).toEqual(['2026-10-20T18:30:00.000Z']);
    expect(recipe.tags.map((tag) => tag.title)).toEqual(['Pasta', 'Quick']);
  });

  test('reuses an existing tag whatever its case', async () => {
    const first = await createRecipe(post, { tags: ['Pasta'] });
    const second = await createRecipe(post, { tags: ['PASTA'] });
    expect(second.tags).toEqual(first.tags);
  });

  test('accepts the values imports and old rows hold', async () => {
    const recipe = await createRecipe(post, {
      yield: 2.5,
      prepTime: 7.5,
      aggregateRating: { value: 87, count: null },
      rating: 0,
      source: 'not a URL',
      description: 'x'.repeat(50_000),
    });
    expect(recipe).toMatchObject({ yield: 2.5, prepTime: 7.5, aggregateRating: { value: 87, count: null }, source: 'not a URL' });
  });

  test.each<[string, Record<string, unknown>, string]>([
    ['no title', { title: undefined }, '"title" is required and must be a non-empty string'],
    ['a blank title', { title: '  ' }, '"title" is required and must be a non-empty string'],
    ['a title over 500 characters', { title: 'x'.repeat(501) }, '"title" must be at most 500 characters'],
    ['a rating over 5', { rating: 5.5 }, '"rating" must be between 0 and 5'],
    ['a yield of 0', { yield: 0 }, '"yield" must be between'],
    ['a negative prep time', { prepTime: -1 }, '"prepTime" must be between 0 and 1000000'],
    ['a flag that is no boolean', { flagged: 'yes' }, '"flagged" must be true or false'],
    ['tags that are no list', { tags: 'Pasta' }, '"tags" must be a list of strings'],
    ['a tag over 200 characters', { tags: ['x'.repeat(201)] }, '"tags" entries must be at most 200 characters'],
    ['more than 1000 ingredients', { ingredients: Array.from({ length: 1001 }, (_, i) => `${i} g`) }, '"ingredients" must hold at most 1000 entries'],
    ['a history entry that is no date-time', { history: ['2026-10-20'] }, '"history" must hold only ISO 8601 date-times with an offset'],
    ['a history entry that is no real moment', { history: ['2026-02-30T10:00:00Z'] }, '"history" must hold only ISO 8601 date-times with an offset'],
    ['nutrition that is no object', { nutrition: 'lots' }, '"nutrition" must be an object'],
    ['a nutrient that is no string', { nutrition: { fat: 20 } }, '"nutrition.fat" must be a string of at most 200 characters'],
    ['an aggregate rating that is no object', { aggregateRating: 4 }, '"aggregateRating" must be an object'],
  ])('refuses %s', async (_name, dto, message) => {
    expect(await refused(dto)).toStartWith(message);
  });
});

describe('GET /api/recipes', () => {
  test('pages with a total, 24 by default', async () => {
    for (let i = 0; i < 26; i++) {
      await createRecipe(post, { title: `Recipe ${String(i).padStart(2, '0')}` });
    }
    const first = await page();
    expect(first).toMatchObject({ total: 26, limit: 24, offset: 0 });
    expect(first.items).toHaveLength(24);
    const last = await page('?limit=24&offset=24');
    expect(last.items.map((item) => item.title)).toEqual(['Recipe 24', 'Recipe 25']);
  });

  test.each(['limit=0', 'limit=201', 'offset=-1', 'offset=100001', 'sort=nutrition_saturatedFat', 'sort=title;--', 'order=up', 'tag=x'])(
    'refuses %s',
    async (query) => {
      expect((await api(`/api/recipes?${query}`)).status).toBe(400);
    },
  );

  test('searches titles, ignoring case and taking wildcards literally', async () => {
    await createRecipe(post, { title: 'Spaghetti Carbonara' });
    await createRecipe(post, { title: 'Ramen' });
    await createRecipe(post, { title: '100% Rye' });
    expect(await titles('?search=SPAG')).toEqual(['Spaghetti Carbonara']);
    expect(await titles('?search=%25')).toEqual(['100% Rye']);
    expect((await page('?search=_')).total).toBe(0);
  });

  test('narrows by every tag given', async () => {
    const carbonara = await createRecipe(post, { title: 'Carbonara', tags: ['Pasta', 'Quick'] });
    await createRecipe(post, { title: 'Lasagna', tags: ['Pasta'] });
    await createRecipe(post, { title: 'Omelette', tags: ['Quick'] });
    const [pasta, quick] = [at(carbonara.tags, 0), at(carbonara.tags, 1)];
    expect([pasta.title, quick.title]).toEqual(['Pasta', 'Quick']);
    expect(await titles(`?tag=${pasta.id}`)).toEqual(['Carbonara', 'Lasagna']);
    expect(await titles(`?tag=${pasta.id}&tag=${quick.id}`)).toEqual(['Carbonara']);
    expect((await page(`?tag=${pasta.id}&tag=${quick.id}`)).total).toBe(1);
    expect(await titles('?tag=999')).toEqual([]);
  });

  test('summarizes each recipe', async () => {
    const created = await createRecipe(post, FULL);
    expect((await page()).items).toEqual([
      {
        id: created.id,
        title: FULL.title,
        flagged: true,
        description: 'Creamy Roman classic',
        thumbnail: null,
        rating: 4.5,
        aggregateRating: { value: 4.21, count: 312 },
        totalTime: 25,
        cookedCount: 2,
        lastCookedAt: '2026-10-20T18:30:00.000Z',
      },
    ]);
  });

  describe('lists by every sort key', () => {
    type Value = string | number | null;
    type Values = [Value, Value, Value];

    const nutrients = (value: string): CreateRecipeDto['nutrition'] => Object.fromEntries(NUTRIENTS.map((key) => [key, value]));

    async function seed(): Promise<{ ids: number[]; values: Record<RecipeSortKey, Values> }> {
      const apple = await createRecipe(post, {
        title: 'Apple',
        rating: 1,
        aggregateRating: { value: 3 },
        prepTime: 30,
        cookTime: 0,
        history: ['2026-01-01T12:00:00.000Z'],
        nutrition: nutrients('3'),
      });
      const banana = await createRecipe(post, {
        title: 'Banana',
        flagged: true,
        rating: 3,
        aggregateRating: { value: 1 },
        prepTime: 10,
        cookTime: 5,
        history: ['2026-02-01T12:00:00.000Z', '2026-02-02T12:00:00.000Z', '2026-03-01T12:00:00.000Z'],
        nutrition: nutrients('1'),
      });
      const cherry = await createRecipe(post, {
        title: 'Cherry',
        rating: 2,
        aggregateRating: { value: 2 },
        prepTime: 20,
        cookTime: 20,
        nutrition: nutrients('2'),
      });
      const of = (read: (recipe: RecipeDto) => Value): Values => [read(apple), read(banana), read(cherry)];
      const nutrient: Values = ['3', '1', '2'];
      return {
        ids: [apple.id, banana.id, cherry.id],
        values: {
          id: of((recipe) => recipe.id),
          title: of((recipe) => recipe.title),
          cooked_count: [1, 3, 0],
          flagged: [0, 1, 0],
          aggregate_rating_value: [3, 1, 2],
          rating: [1, 3, 2],
          created_at: of((recipe) => recipe.createdAt),
          updated_at: of((recipe) => recipe.updatedAt),
          last_cooked_at: ['2026-01-01T12:00:00.000Z', '2026-03-01T12:00:00.000Z', null],
          prep_time: [30, 10, 20],
          cook_time: [0, 5, 20],
          total_time: [30, 15, 40],
          nutrition_calories: nutrient,
          nutrition_carbohydrate: nutrient,
          nutrition_cholesterol: nutrient,
          nutrition_fat: nutrient,
          nutrition_fiber: nutrient,
          nutrition_protein: nutrient,
          nutrition_saturated_fat: nutrient,
          nutrition_sodium: nutrient,
          nutrition_sugar: nutrient,
          nutrition_trans_fat: nutrient,
          nutrition_unsaturated_fat: nutrient,
        },
      };
    }

    // SQLite sorts NULL first ascending and last descending; ties fall back to the id, ascending.
    function expected(ids: number[], values: Values, order: 'asc' | 'desc'): number[] {
      const compare = (a: Value, b: Value): number => {
        if (a === b) {
          return 0;
        }
        if (a === null || b === null) {
          return a === null ? -1 : 1;
        }
        return a < b ? -1 : 1;
      };
      return [0, 1, 2].toSorted((a, b) => (order === 'asc' ? 1 : -1) * compare(values[a] ?? null, values[b] ?? null) || a - b).map((index) => at(ids, index));
    }

    const cases = RECIPE_SORT_KEYS.flatMap((key) => [[key, 'asc'] as const, [key, 'desc'] as const]);

    test.each(cases)('%s %s', async (key, order) => {
      const { ids, values } = await seed();
      const listed = (await page(`?sort=${key}&order=${order}`)).items.map((item) => item.id);
      expect(listed).toEqual(expected(ids, values[key], order));
    });
  });

  test('sorts by title, ascending, by default', async () => {
    await createRecipe(post, { title: 'Cherry' });
    await createRecipe(post, { title: 'Apple' });
    expect(await titles()).toEqual(['Apple', 'Cherry']);
  });
});

describe('GET /api/recipes/:id', () => {
  test('answers the recipe with its tags, newest history first, and its parsed, unscaled ingredients in the stored order', async () => {
    const created = await createRecipe(post, { ...FULL, ingredients: ['Salt', '⅓ TL Pfeffer', '400 g Spaghetti', '2 Eier'] });
    const recipe = await body<RecipeDto>(await api(`/api/recipes/${created.id}`));
    expect(recipe).toEqual(created);
    expect(recipe.ingredients.map((ingredient) => [ingredient.raw, ingredient.quantity])).toEqual([
      ['Salt', null],
      ['⅓ TL Pfeffer', 1 / 3],
      ['400 g Spaghetti', 400],
      ['2 Eier', 2],
    ]);
  });

  test('answers 404 for a recipe that does not exist and 400 for an id that is none', async () => {
    expect((await api('/api/recipes/999')).status).toBe(404);
    expect((await api('/api/recipes/abc')).status).toBe(400);
  });
});

describe('PATCH /api/recipes/:id', () => {
  test('flags and unflags', async () => {
    const { id } = await createRecipe(post);
    expect((await body<RecipeDto>(await patch(`/api/recipes/${id}`, { flagged: true }))).flagged).toBe(true);
    expect((await body<RecipeDto>(await patch(`/api/recipes/${id}`, { flagged: false }))).flagged).toBe(false);
  });

  test('changes only the fields present, and moves updatedAt', async () => {
    const created = await createRecipe(post, FULL);
    await Bun.sleep(5);
    const res = await patch(`/api/recipes/${created.id}`, { title: 'Carbonara', prepTime: 5 });
    expect(res.status).toBe(200);
    const updated = await body<RecipeDto>(res);
    expect(updated).toEqual({ ...created, title: 'Carbonara', prepTime: 5, totalTime: 20, updatedAt: updated.updatedAt });
    expect(updated.updatedAt > created.updatedAt).toBe(true);
  });

  test('records a cooking the first time an unrated recipe is rated, and only then', async () => {
    const { id } = await createRecipe(post);
    const before = Date.now();
    const rated = await body<RecipeDto>(await patch(`/api/recipes/${id}`, { rating: 4 }));
    expect(rated.rating).toBe(4);
    expect(rated.history).toHaveLength(1);
    expect(Date.parse(rated.history[0] ?? '')).toBeGreaterThanOrEqual(before - 1000);
    const rerated = await body<RecipeDto>(await patch(`/api/recipes/${id}`, { rating: 4.5 }));
    expect(rerated.history).toEqual(rated.history);
    const cleared = await body<RecipeDto>(await patch(`/api/recipes/${id}`, { rating: 0 }));
    expect(cleared.history).toEqual(rated.history);
  });

  test('replaces the history and the tags when present', async () => {
    const { id } = await createRecipe(post, FULL);
    const updated = await body<RecipeDto>(await patch(`/api/recipes/${id}`, { history: ['2025-01-01T12:00:00Z'], tags: ['Quick'] }));
    expect(updated.history).toEqual(['2025-01-01T12:00:00.000Z']);
    expect(updated.tags.map((tag) => tag.title)).toEqual(['Quick']);
  });

  test('validates only the fields present', async () => {
    const { id } = await createRecipe(post);
    expect((await patch(`/api/recipes/${id}`, { rating: 7 })).status).toBe(400);
    expect((await patch(`/api/recipes/${id}`, { title: '' })).status).toBe(400);
    expect((await patch(`/api/recipes/${id}`, {})).status).toBe(200);
  });

  test('answers 404 for a recipe that does not exist', async () => {
    expect((await patch('/api/recipes/999', { flagged: true })).status).toBe(404);
  });

  test('saves a row of the old app back unchanged, whole', async () => {
    const database = db();
    database.run(
      `INSERT INTO recipe (id, created_at, updated_at, title, description, source, thumbnail, yield, nutrition_calories, prep_time, cook_time,
                           aggregate_rating_value, aggregate_rating_count, rating, ingredients, instructions, flagged)
       VALUES (12, '2021-03-27 10:00:00', '2021-03-28 11:30:00', 'Gemüsereis', NULL, NULL, NULL, NULL, '540 kcal', 7.5, 25,
               87, 12, NULL, '["200 g Reis","1 Zwiebel"]', NULL, 0)`,
    );
    database.run("INSERT INTO recipe_history (recipe_id, timestamp) VALUES (12, '2021-04-01 18:00:00'), (12, '2021-05-02T17:30:00.000Z')");
    database.run("INSERT INTO recipe_review (recipe_id, date, text) VALUES (12, '2021-01-01T00:00:00.000Z', 'Lecker')");
    database.run("INSERT INTO tag (id, title) VALUES (5, 'Reis')");
    database.run('INSERT INTO recipe_tag (tag_id, recipe_id) VALUES (5, 12)');

    const legacy = await body<RecipeDto>(await api('/api/recipes/12'));
    expect(legacy).toMatchObject({
      description: '',
      source: '',
      yield: null,
      prepTime: 7.5,
      aggregateRating: { value: 87, count: 12 },
      rating: 0,
      instructions: [],
      history: ['2021-05-02T17:30:00.000Z', '2021-04-01T18:00:00.000Z'],
      reviews: [{ date: '2021-01-01T00:00:00.000Z', text: 'Lecker' }],
      createdAt: '2021-03-27T10:00:00.000Z',
    });

    const whole: EditRecipeDto = {
      title: legacy.title,
      flagged: legacy.flagged,
      description: legacy.description,
      source: legacy.source,
      yield: legacy.yield,
      nutrition: legacy.nutrition,
      prepTime: legacy.prepTime,
      cookTime: legacy.cookTime,
      aggregateRating: legacy.aggregateRating,
      rating: legacy.rating,
      ingredients: legacy.ingredients.map((ingredient) => ingredient.raw),
      instructions: legacy.instructions,
      history: legacy.history,
      tags: legacy.tags.map((tag) => tag.title),
    };
    const res = await patch('/api/recipes/12', whole);
    expect(res.status).toBe(200);
    const saved = await body<RecipeDto>(res);
    // A NULL yield is stored as 1, the scale the old app used for it.
    expect(saved).toEqual({ ...legacy, yield: 1, updatedAt: saved.updatedAt });
  });
});

describe('DELETE /api/recipes/:id', () => {
  test('deletes the recipe, its thumbnail file and the tags left without recipes', async () => {
    const keep = await createRecipe(post, { title: 'Lasagna', tags: ['Pasta'] });
    const gone = await createRecipe(post, { tags: ['Pasta', 'Quick'] });
    copyFileSync(join(import.meta.dir, '../thumbnails/1x1.png'), join(configDir(), 'thumbnails', 'carbonara.png'));
    db().run("UPDATE recipe SET thumbnail = 'carbonara.png' WHERE id = ?", [gone.id]);

    expect((await del(`/api/recipes/${gone.id}`)).status).toBe(204);

    expect((await api(`/api/recipes/${gone.id}`)).status).toBe(404);
    expect(existsSync(join(configDir(), 'thumbnails', 'carbonara.png'))).toBe(false);
    expect((await body<TagDto[]>(await api('/api/tags'))).map((tag) => tag.title)).toEqual(['Pasta']);
    expect((await api(`/api/recipes/${keep.id}`)).status).toBe(200);
  });

  test('answers 404 for a recipe that does not exist', async () => {
    expect((await del('/api/recipes/999')).status).toBe(404);
  });
});

describe('the old URLs', () => {
  test.each([
    ['/recipe/12/spaghetti-carbonara', '/recipes/12'],
    ['/recipe/12/spaghetti-carbonara/edit', '/recipes/12/edit'],
    ['/recipe/create', '/recipes/new'],
    ['/recipe/import', '/recipes/import'],
  ])('redirect %s permanently to %s', async (from, to) => {
    const res = await api(from, { redirect: 'manual' });
    expect(res.status).toBe(301);
    expect(new URL(res.headers.get('location') ?? '').pathname).toBe(to);
  });

  test('answer 404 for an id that is none', async () => {
    expect((await api('/recipe/abc/slug', { redirect: 'manual' })).status).toBe(404);
    expect((await api('/recipe/abc/slug/edit', { redirect: 'manual' })).status).toBe(404);
  });
});

describe('editing tags', () => {
  async function tagTitles(): Promise<string[]> {
    return (await body<TagDto[]>(await api('/api/tags'))).map((tag) => tag.title);
  }

  test('creates new tags, reuses existing ones and deletes those left without recipes', async () => {
    const lasagna = await createRecipe(post, { title: 'Lasagna', tags: ['Pasta'] });
    const { id } = await createRecipe(post, { tags: ['Pasta', 'Quick', 'Italian'] });
    const updated = await body<RecipeDto>(await patch(`/api/recipes/${id}`, { tags: ['pasta', 'Dinner'] }));
    expect(updated.tags.map((tag) => tag.title)).toEqual(['Dinner', 'Pasta']);
    expect(updated.tags.find((tag) => tag.title === 'Pasta')?.id).toBe(lasagna.tags[0]?.id);
    expect(await tagTitles()).toEqual(['Dinner', 'Pasta']);
  });

  test('keeps a tag with a comma whole', async () => {
    const { id } = await createRecipe(post);
    const updated = await body<RecipeDto>(await patch(`/api/recipes/${id}`, { tags: ['Salt, pepper', 'Quick'] }));
    expect(updated.tags.map((tag) => tag.title)).toEqual(['Quick', 'Salt, pepper']);
  });

  test('deletes every tag when the list is emptied', async () => {
    const { id } = await createRecipe(post, { tags: ['Pasta'] });
    await patch(`/api/recipes/${id}`, { tags: [] });
    expect(await tagTitles()).toEqual([]);
  });
});

describe('PUT /api/recipes/:id/thumbnail', () => {
  const PNG = join(import.meta.dir, '../thumbnails/1x1.png');

  function upload(id: number, bytes: Uint8Array<ArrayBuffer> | string, type: string | null): Promise<Response> {
    return api(`/api/recipes/${id}/thumbnail`, { method: 'PUT', headers: type === null ? {} : { 'Content-Type': type }, body: bytes });
  }

  async function png(): Promise<Uint8Array<ArrayBuffer>> {
    return new Uint8Array(await Bun.file(PNG).arrayBuffer());
  }

  test('stores the image under a name from the title and answers the recipe', async () => {
    const { id } = await createRecipe(post, { title: 'Gemüse-Reis à la Maison' });
    const res = await upload(id, await png(), 'image/png');
    expect(res.status).toBe(200);
    const recipe = await body<RecipeDto>(res);
    expect(recipe.thumbnail).toBe('/thumbnails/gemuse-reis-a-la-maison.png');
    const served = await api(recipe.thumbnail ?? '');
    expect(served.status).toBe(200);
    expect(served.headers.get('content-type')).toBe('image/png');
  });

  test('replaces an earlier image and removes its file', async () => {
    const { id } = await createRecipe(post, { title: 'Ramen' });
    await upload(id, await png(), 'image/png');
    const second = await body<RecipeDto>(await upload(id, await png(), 'image/jpeg'));
    expect(second.thumbnail).toBe('/thumbnails/ramen.jpg');
    expect(existsSync(join(configDir(), 'thumbnails', 'ramen.png'))).toBe(false);
    expect(existsSync(join(configDir(), 'thumbnails', 'ramen.jpg'))).toBe(true);
  });

  test.each([
    ['text/plain', 415],
    ['application/json', 415],
    [null, 415],
  ])('refuses a body sent as %p with %p', async (type, status) => {
    const { id } = await createRecipe(post);
    expect((await upload(id, 'not an image', type)).status).toBe(status);
  });

  test('refuses an empty image', async () => {
    const { id } = await createRecipe(post);
    expect((await upload(id, new Uint8Array(), 'image/png')).status).toBe(400);
  });

  test('answers 404 for a recipe that does not exist', async () => {
    expect((await upload(999, await png(), 'image/png')).status).toBe(404);
  });

  test('logs the upload by its size and type', async () => {
    const { id } = await createRecipe(post);
    await upload(id, await png(), 'image/png');
    const size = Bun.file(PNG).size;
    expect(logs().at(-1)?.text).toMatch(new RegExp(`^http PUT /api/recipes/${id}/thumbnail 200 \\d+ms <${size} bytes image/png>$`));
  });
});

describe('DELETE /api/recipes/:id/thumbnail', () => {
  test('removes the image and its file', async () => {
    const { id } = await createRecipe(post, { title: 'Ramen' });
    await api(`/api/recipes/${id}/thumbnail`, {
      method: 'PUT',
      headers: { 'Content-Type': 'image/png' },
      body: await Bun.file(join(import.meta.dir, '../thumbnails/1x1.png')).bytes(),
    });
    const res = await del(`/api/recipes/${id}/thumbnail`);
    expect(res.status).toBe(200);
    expect((await body<RecipeDto>(res)).thumbnail).toBeNull();
    expect(existsSync(join(configDir(), 'thumbnails', 'ramen.png'))).toBe(false);
  });

  test('is harmless without an image', async () => {
    const { id } = await createRecipe(post);
    expect((await del(`/api/recipes/${id}/thumbnail`)).status).toBe(200);
  });
});

describe('POST /api/recipes/import', () => {
  let site: Server<undefined>;

  beforeEach(() => {
    site = Bun.serve({
      port: 0,
      routes: {
        '/gemuesereis': new Response(Bun.file(join(import.meta.dir, 'internal/import/complex.html')), { headers: { 'Content-Type': 'text/html' } }),
        '/image.png': new Response(Bun.file(join(import.meta.dir, '../thumbnails/1x1.png')), { headers: { 'Content-Type': 'image/png' } }),
        '/about': new Response('<html><body>No recipe here.</body></html>', { headers: { 'Content-Type': 'text/html' } }),
      },
      fetch: () => new Response('gone', { status: 404 }),
    });
  });

  afterEach(async () => {
    await site.stop(true);
  });

  const siteUrl = (path: string): string => new URL(path, site.url).href;

  test('creates the recipe with its tags, reviews and thumbnail, and links it in the result', async () => {
    const res = await post('/api/recipes/import', { urls: [siteUrl('/gemuesereis')] });
    expect(res.status).toBe(200);
    const { results } = await body<ImportResultDto>(res);
    expect(results.map((result) => [result.url, result.recipe?.title, result.error])).toEqual([[siteUrl('/gemuesereis'), 'Gemüsereis', null]]);
    const recipe = await body<RecipeDto>(await api(`/api/recipes/${results[0]?.recipe?.id}`));
    expect(recipe).toMatchObject({
      title: 'Gemüsereis',
      description: 'Schneller Reis mit Gemüse.',
      source: siteUrl('/gemuesereis'),
      yield: 4,
      prepTime: 15,
      cookTime: 25,
      aggregateRating: { value: 4.6, count: 128 },
      instructions: ['Zwiebel würfeln und in Öl anschwitzen.', 'Reis zugeben und garen.'],
      reviews: [{ date: '2024-03-12T10:00:00.000Z', text: 'Sehr lecker!' }],
    });
    expect(recipe.nutrition).toMatchObject({ calories: '420 kcal', protein: '12 g' });
    expect(recipe.ingredients.map((ingredient) => ingredient.raw)).toEqual(['250 g Reis', '1 Zwiebel', '2 EL Öl', 'Salz']);
    expect(recipe.tags.map((tag) => tag.title)).toEqual(['Gemüse', 'Reis', 'Schnell']);
    expect(recipe.thumbnail).toBe('/thumbnails/image.png');
    expect((await api(recipe.thumbnail ?? '')).status).toBe(200);
  });

  test('reports a missing page and a page without a recipe, keeps the input order, and logs the failures', async () => {
    const urls = [siteUrl('/missing'), siteUrl('/gemuesereis'), siteUrl('/about')];
    const { results } = await body<ImportResultDto>(await post('/api/recipes/import', { urls }));
    expect(results.map((result) => [result.url, result.recipe?.title ?? null, result.error])).toEqual([
      [siteUrl('/missing'), null, 'The page answered 404'],
      [siteUrl('/gemuesereis'), 'Gemüsereis', null],
      [siteUrl('/about'), null, 'No schema.org recipe found'],
    ]);
    expect(logs()).toContainEqual({ level: 'warn', text: `import ${siteUrl('/missing')}: The page answered 404` });
  });

  test('imports a recipe whose image fails, without a thumbnail', async () => {
    const page = (await Bun.file(join(import.meta.dir, 'internal/import/complex.html')).text()).replace('/image.png', '/no-image.png');
    await site.stop(true);
    site = Bun.serve({
      port: 0,
      routes: { '/page': new Response(page, { headers: { 'Content-Type': 'text/html' } }) },
      fetch: () => new Response('', { status: 404 }),
    });
    const { results } = await body<ImportResultDto>(await post('/api/recipes/import', { urls: [siteUrl('/page')] }));
    expect(results[0]?.error).toBeNull();
    const recipe = await body<RecipeDto>(await api(`/api/recipes/${results[0]?.recipe?.id}`));
    expect(recipe.thumbnail).toBeNull();
    expect(logs()).toContainEqual({ level: 'warn', text: `import ${siteUrl('/page')}: No thumbnail: The image answered 404` });
  });

  test('drops blank lines', async () => {
    const { results } = await body<ImportResultDto>(await post('/api/recipes/import', { urls: ['  ', siteUrl('/about'), ''] }));
    expect(results).toHaveLength(1);
  });

  test.each<[string, unknown]>([
    ['no list', 'https://example.com'],
    ['an empty list', []],
    ['only blank lines', [' ', '']],
    ['more than 50 URLs', Array.from({ length: 51 }, (_, i) => `https://example.com/${i}`)],
    ['a line that is no URL', ['example.com/recipe']],
    ['a URL that is no http(s)', ['ftp://example.com/recipe']],
    ['an entry that is no string', [42]],
  ])('refuses %s', async (_name, urls) => {
    expect((await post('/api/recipes/import', { urls })).status).toBe(400);
  });
});

const NUTRIENTS = [
  'calories',
  'carbohydrate',
  'cholesterol',
  'fat',
  'fiber',
  'protein',
  'saturatedFat',
  'sodium',
  'sugar',
  'transFat',
  'unsaturatedFat',
] as const;
