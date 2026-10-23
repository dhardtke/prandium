import { beforeEach, describe, expect, test } from 'bun:test';
import type { FetchFn } from './fetch.ts';
import { type ImportedRecipe, type ImportedReview, importRecipes, mapSchemaRecipe, NO_RECIPE_FOUND } from './import-recipe.ts';
import type { ParseHtmlToSchema, SchemaObject } from './schema-parser.ts';

let fetched: { url: string; userAgent: string }[];
let pages: Map<string, string>;
let schemas: Map<string, SchemaObject | null>;

beforeEach(() => {
  fetched = [];
  pages = new Map();
  schemas = new Map();
});

const fetchFn: FetchFn = (url, userAgent) => {
  fetched.push({ url, userAgent });
  const page = pages.get(url);
  return page === undefined ? Promise.reject(new Error(`Can't fetch URL ${url}.`)) : Promise.resolve(new Response(page));
};

// The page's HTML is its URL, so the parser can look the schema up by it.
const parserFactory = (html: string): ParseHtmlToSchema => ({ findFirstRecipe: () => schemas.get(html) ?? null });

function serve(url: string, schema: SchemaObject | null): void {
  pages.set(url, url);
  schemas.set(url, schema);
}

async function importOne(schema: SchemaObject): Promise<ImportedRecipe | null> {
  serve('https://example.com/r', schema);
  const [result] = await importRecipes(['https://example.com/r'], { importConcurrency: 1, userAgent: 'UA', fetchFn, parserFactory });
  return result?.recipe ?? null;
}

describe('importRecipes', () => {
  test('imports nothing for no URLs', async () => {
    expect(await importRecipes([], { importConcurrency: 1, userAgent: '', fetchFn })).toEqual([]);
    expect(fetched).toEqual([]);
  });

  test('fetches each URL once with the user agent', async () => {
    await importRecipes(['https://example.com'], { importConcurrency: 1, userAgent: 'My User Agent', fetchFn, parserFactory });
    expect(fetched).toEqual([{ url: 'https://example.com', userAgent: 'My User Agent' }]);
  });

  test('keeps importing after a URL fails, in input order', async () => {
    serve('url2', {});
    const results = await importRecipes(['url1', 'url2', 'url3'], { importConcurrency: 2, userAgent: '', fetchFn, parserFactory });
    expect(results.map((result) => [result.url, result.error])).toEqual([
      ['url1', "Can't fetch URL url1."],
      ['url2', null],
      ['url3', "Can't fetch URL url3."],
    ]);
    expect(results[1]?.recipe?.source).toBe('url2');
  });

  test('reports a page without a recipe', async () => {
    serve('url', null);
    expect(await importRecipes(['url'], { importConcurrency: 1, userAgent: '', fetchFn, parserFactory })).toEqual([
      { url: 'url', recipe: null, error: NO_RECIPE_FOUND },
    ]);
  });

  test('reports a page that answers an error status', async () => {
    const notFound: FetchFn = () => Promise.resolve(new Response('gone', { status: 404 }));
    expect(await importRecipes(['url'], { importConcurrency: 1, userAgent: '', fetchFn: notFound, parserFactory })).toEqual([
      { url: 'url', recipe: null, error: 'The page answered 404' },
    ]);
  });
});

describe('mapSchemaRecipe', () => {
  test('fills every field with a default when the schema sets none, titled by the URL', () => {
    expect(mapSchemaRecipe({}, 'https://example.com/r')).toEqual({
      title: 'https://example.com/r',
      description: '',
      source: 'https://example.com/r',
      yield: null,
      nutrition: {
        calories: null,
        carbohydrate: null,
        cholesterol: null,
        fat: null,
        fiber: null,
        protein: null,
        saturatedFat: null,
        sodium: null,
        sugar: null,
        transFat: null,
        unsaturatedFat: null,
      },
      prepTime: 0,
      cookTime: 0,
      aggregateRating: { value: null, count: null },
      ingredients: [],
      instructions: [],
      tags: [],
      reviews: [],
      thumbnailUrl: null,
    });
  });

  test.each<[unknown, string[]]>([
    [
      ['instruction1', 'instruction2'],
      ['instruction1', 'instruction2'],
    ],
    [['   instruction1   '], ['instruction1']],
    ['instruction1\ninstruction2\ninstruction3', ['instruction1', 'instruction2', 'instruction3']],
    ['', []],
    [
      [
        { '@type': 'HowToStep', text: ' Boil ' },
        { '@type': 'HowToStep', name: 'Serve' },
      ],
      ['Boil', 'Serve'],
    ],
  ])('reads the instructions %j as %j', async (given, instructions) => {
    expect((await importOne({ recipeInstructions: given }))?.instructions).toEqual(instructions);
  });

  describe.each(['keywords', 'recipeCategory'])('reads tags from %s', (field) => {
    test.each<[unknown, string[]]>([
      [
        ['tag1', 'tag2'],
        ['tag1', 'tag2'],
      ],
      [['   tag1   '], ['tag1']],
      ['tag1,tag2,tag3', ['tag1', 'tag2', 'tag3']],
      ['', []],
      ['tag1, tag2, tag3', ['tag1', 'tag2', 'tag3']],
      [
        ['tag1, tag2, tag3', 'tag4'],
        ['tag1, tag2, tag3', 'tag4'],
      ],
    ])('%j as %j', async (given, tags) => {
      expect((await importOne({ [field]: given }))?.tags).toEqual(tags);
    });
  });

  describe.each(['review', 'reviews'])('reads reviews from %s', (field) => {
    test.each<[unknown, ImportedReview[]]>([
      [{ datePublished: '1970-01-01T00:00:00.000Z', reviewBody: 'review' }, [{ date: '1970-01-01T00:00:00.000Z', text: 'review' }]],
      [{ datePublished: '1970-01-01T00:00:00.000Z', reviewBody: '  review    ' }, [{ date: '1970-01-01T00:00:00.000Z', text: 'review' }]],
      [{ datePublished: '1970-01-01T00:00:00.000Z', reviewBody: '  ' }, []],
    ])('%j as %j', async (given, reviews) => {
      expect((await importOne({ [field]: given }))?.reviews).toEqual(reviews);
    });
  });

  test.each([
    ['calories', 'calories'],
    ['carbohydrateContent', 'carbohydrate'],
    ['cholesterolContent', 'cholesterol'],
    ['fatContent', 'fat'],
    ['fiberContent', 'fiber'],
    ['proteinContent', 'protein'],
    ['saturatedFatContent', 'saturatedFat'],
    ['sodiumContent', 'sodium'],
    ['sugarContent', 'sugar'],
    ['transFatContent', 'transFat'],
    ['unsaturatedFatContent', 'unsaturatedFat'],
  ])('reads nutrition.%s into nutrition.%s', async (schemaField, field) => {
    expect((await importOne({ nutrition: { [schemaField]: 'my nutritional value' } }))?.nutrition).toMatchObject({ [field]: 'my nutritional value' });
  });

  test('reads the times as minutes', async () => {
    expect(await importOne({ prepTime: 'PT20M', cookTime: 'PT1H25M' })).toMatchObject({ prepTime: 20, cookTime: 85 });
  });

  test('reads the yield, the title, the description and the aggregate rating', async () => {
    const recipe = await importOne({
      name: ' Ramen ',
      description: 'Rich',
      recipeYield: ['4 servings'],
      aggregateRating: { ratingValue: '4.21', ratingCount: 312 },
    });
    expect(recipe).toMatchObject({ title: 'Ramen', description: 'Rich', yield: 4, aggregateRating: { value: 4.21, count: 312 } });
  });

  test.each<[unknown, string | null]>([
    ['https://cdn.example.com/a.jpg', 'https://cdn.example.com/a.jpg'],
    [['/img/a.jpg', '/img/b.jpg'], 'https://example.com/img/a.jpg'],
    [{ '@type': 'ImageObject', url: 'https://cdn.example.com/c.png' }, 'https://cdn.example.com/c.png'],
    [undefined, null],
  ])('reads the image %j as the thumbnail URL %p', async (image, url) => {
    expect((await importOne({ image }))?.thumbnailUrl).toBe(url);
  });
});
