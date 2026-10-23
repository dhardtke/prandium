import type { Iso8601DateTime } from '../../../../../shared/flavors.ts';
import type { NutritionDto } from '../../../../../shared/dto/recipe.ts';
import { toDate } from './convert.ts';
import { durationToMinutes, parseDuration } from './duration.ts';
import { type FetchFn, fetchWithUserAgent } from './fetch.ts';
import { pooledMap } from './pooled-map.ts';
import { type ParseHtmlToSchema, type SchemaObject, SchemaParser } from './schema-parser.ts';
import { ensureArray, extractFloat, extractNumber, field, first, text } from './util.ts';

export interface ImportedReview {
  date: Iso8601DateTime;
  text: string;
}

/** A recipe as a page describes it, before it is stored. */
export interface ImportedRecipe {
  title: string;
  description: string;
  source: string;
  yield: number | null;
  nutrition: NutritionDto;
  prepTime: number;
  cookTime: number;
  aggregateRating: { value: number | null; count: number | null };
  ingredients: string[];
  instructions: string[];
  tags: string[];
  reviews: ImportedReview[];
  thumbnailUrl: string | null;
}

export type ImportResult = { url: string; recipe: ImportedRecipe; error: null } | { url: string; recipe: null; error: string };

export interface ImportOptions {
  importConcurrency: number;
  userAgent: string;
  fetchFn?: FetchFn;
  parserFactory?: (html: string) => ParseHtmlToSchema;
}

export const NO_RECIPE_FOUND = 'No schema.org recipe found';

function trimmed(values: unknown[]): string[] {
  return values.flatMap((value) => {
    const line = text(value)?.trim();
    return line === undefined || line === '' ? [] : [line];
  });
}

function parseInstructions(recipe: SchemaObject): string[] {
  return trimmed(
    ensureArray(recipe.recipeInstructions).flatMap((instruction) =>
      typeof instruction === 'string' ? instruction.split('\n') : [text(field(instruction, 'text')) ?? text(field(instruction, 'name'))],
    ),
  );
}

function parseTags(recipe: SchemaObject): string[] {
  const keywords = trimmed(ensureArray(recipe.keywords ?? recipe.recipeCategory));
  const [only] = keywords;
  return keywords.length === 1 && only !== undefined ? trimmed(only.split(/, ?/)) : keywords;
}

function parseReviews(recipe: SchemaObject): ImportedReview[] {
  return ensureArray(recipe.review ?? recipe.reviews).flatMap((review) => {
    const body = text(first(field(review, 'reviewBody')))?.trim() ?? '';
    if (body === '') {
      return [];
    }
    const published = text(first(field(review, 'datePublished')));
    return [{ date: toDate(published).toISOString(), text: body }];
  });
}

function minutes(duration: unknown): number {
  const iso = text(first(duration));
  return iso === undefined || iso === '' ? 0 : durationToMinutes(parseDuration(iso));
}

function thumbnailUrl(recipe: SchemaObject, pageUrl: string): string | null {
  const image = first(recipe.image);
  const raw = text(image) ?? text(first(field(image, 'url')));
  if (raw === undefined || raw === '') {
    return null;
  }
  try {
    return new URL(raw, pageUrl).href;
  } catch {
    return null;
  }
}

export function mapSchemaRecipe(recipe: SchemaObject, url: string): ImportedRecipe {
  const nutrition = first(recipe.nutrition);
  const nutrient = (key: string): string | null => text(first(field(nutrition, key)))?.trim() ?? null;
  const rating = first(recipe.aggregateRating);
  const title = text(first(recipe.name))?.trim() ?? '';

  return {
    title: title === '' ? url : title,
    description: text(first(recipe.description))?.trim() ?? '',
    source: url,
    yield: extractNumber(first(recipe.recipeYield ?? recipe.yield)) ?? null,
    nutrition: {
      calories: nutrient('calories'),
      carbohydrate: nutrient('carbohydrateContent'),
      cholesterol: nutrient('cholesterolContent'),
      fat: nutrient('fatContent'),
      fiber: nutrient('fiberContent'),
      protein: nutrient('proteinContent'),
      saturatedFat: nutrient('saturatedFatContent'),
      sodium: nutrient('sodiumContent'),
      sugar: nutrient('sugarContent'),
      transFat: nutrient('transFatContent'),
      unsaturatedFat: nutrient('unsaturatedFatContent'),
    },
    prepTime: minutes(recipe.prepTime),
    cookTime: minutes(recipe.cookTime),
    aggregateRating: {
      value: extractFloat(first(field(rating, 'ratingValue'))) ?? null,
      count: extractNumber(first(field(rating, 'ratingCount') ?? field(rating, 'reviewCount'))) ?? null,
    },
    ingredients: trimmed(ensureArray(recipe.recipeIngredient ?? recipe.ingredients)),
    instructions: parseInstructions(recipe),
    tags: parseTags(recipe),
    reviews: parseReviews(recipe),
    thumbnailUrl: thumbnailUrl(recipe, url),
  };
}

async function importRecipe(url: string, options: ImportOptions): Promise<ImportedRecipe> {
  const response = await (options.fetchFn ?? fetchWithUserAgent)(url, options.userAgent);
  if (!response.ok) {
    throw new Error(`The page answered ${response.status}`);
  }
  const html = new TextDecoder().decode(await response.arrayBuffer());
  const recipe = (options.parserFactory ?? ((page: string): ParseHtmlToSchema => new SchemaParser(page)))(html).findFirstRecipe();
  if (!recipe) {
    throw new Error(NO_RECIPE_FOUND);
  }
  return mapSchemaRecipe(recipe, url);
}

async function importFromUrl(url: string, options: ImportOptions): Promise<ImportResult> {
  try {
    return { url, recipe: await importRecipe(url, options), error: null };
  } catch (error) {
    return { url, recipe: null, error: error instanceof Error ? error.message : String(error) };
  }
}

/** Results come in the order of `urls`; a failing URL never stops the others. */
export async function importRecipes(urls: readonly string[], options: ImportOptions): Promise<ImportResult[]> {
  if (urls.length === 0) {
    return [];
  }
  const concurrency = Math.max(1, Math.min(urls.length, options.importConcurrency));
  return Array.fromAsync(pooledMap(concurrency, urls, (url) => importFromUrl(url, options)));
}
