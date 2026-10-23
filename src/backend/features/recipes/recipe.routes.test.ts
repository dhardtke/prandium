import { describe, expect, test } from 'bun:test';
import type { CreateRecipeDto, RecipeDto, RecipePageDto, RecipeSortKey } from '../../../shared/dto/recipe.ts';
import type { ErrorDto } from '../../../shared/dto/error.ts';
import { at, body, useServer } from '../../testing.ts';
import { RECIPE_SORT_KEYS } from './recipes.facade.ts';
import { createRecipe } from './recipes.fixtures.ts';

const { api, post } = useServer();

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
      { raw: '400 g Spaghetti', quantity: 400, unit: 'g', description: 'Spaghetti' },
      { raw: '4 egg yolks', quantity: 4, unit: null, description: 'egg yolks' },
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
