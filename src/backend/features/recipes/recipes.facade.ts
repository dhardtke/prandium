import type {
  CreateRecipeDto,
  EditRecipeDto,
  ImportRecipesDto,
  NutritionDto,
  RecipeFilterDto,
  RecipeSortDto,
  RecipeSortKey,
} from '../../../shared/dto/recipe.ts';
import type { RecipeId } from '../../../shared/flavors.ts';
import type { Config } from '../../config.ts';
import type { DB } from '../../db/db.ts';
import { badRequest, notFound } from '../../http/errors.ts';
import {
  dateTimeList,
  optionalNumber,
  optionalString,
  requiredBoolean,
  requiredNumber,
  requiredString,
  stringList,
  validatePresent,
} from '../../shared/validate.ts';
import { createTagFacade } from '../tags/tags.facade.ts';
import { createThumbnailsFacade, type ThumbnailsFacade } from '../thumbnails/thumbnails.facade.ts';
import { importRecipes } from './internal/import/import-recipe.ts';
import { RecipeRepository } from './internal/recipe.repository.ts';
import { translateDtoToCreateRecipe, translateDtoToEditRecipe, translateImportedToCreateRecipeDto } from './internal/recipe.translator.ts';
import { RECIPE_SORT_KEYS as SORT_COLUMNS, type RecipeDetails, type RecipeSummaryRow, type ReviewRow } from './ports/recipe.ts';

export const RECIPE_SORT_KEYS: readonly RecipeSortKey[] = SORT_COLUMNS satisfies readonly RecipeSortKey[];
export const MAX_SEARCH_LENGTH = 500;

// Bounds are generous on purpose: imports and old rows hold values the form would refuse, and they must save back unchanged.
const LIMITS = {
  title: 500,
  description: 50_000,
  source: 2000,
  yield: 10_000,
  nutrient: 200,
  minutes: 1_000_000,
  ratingValue: 1_000_000,
  ratingCount: 1_000_000_000,
  ingredients: { maxItems: 1000, maxLength: 5000 },
  instructions: { maxItems: 1000, maxLength: 50_000 },
  history: { maxItems: 10_000 },
  tags: { maxItems: 200, maxLength: 200 },
} as const;

function thumbnailName(title: string): string {
  const slug = title
    .normalize('NFKD')
    .replaceAll(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, '-')
    .replaceAll(/^-+|-+$/g, '')
    .slice(0, 60);
  return slug === '' ? 'thumbnail' : slug;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export const MAX_IMPORT_URLS = 50;

export interface ImportOutcome {
  url: string;
  recipe: RecipeDetails | null;
  error: string | null;
  /** Something that went wrong without failing the import, such as an image that would not download. */
  warning: string | null;
}

function message(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export class RecipesFacade {
  readonly #recipes: RecipeRepository;
  readonly #thumbnails: ThumbnailsFacade;
  readonly #importOptions: { importConcurrency: number; userAgent: string };

  constructor(recipes: RecipeRepository, thumbnails: ThumbnailsFacade, importOptions: { importConcurrency: number; userAgent: string }) {
    this.#recipes = recipes;
    this.#thumbnails = thumbnails;
    this.#importOptions = importOptions;
  }

  /** Each URL is fetched, parsed and created on its own: one failing never stops the others. Results keep the input order. */
  async import(dto: ImportRecipesDto): Promise<ImportOutcome[]> {
    const urls = this.#validateUrls(dto);
    const outcomes: ImportOutcome[] = [];
    for (const result of await importRecipes(urls, this.#importOptions)) {
      if (result.recipe === null) {
        outcomes.push({ url: result.url, recipe: null, error: result.error, warning: null });
        continue;
      }
      const imported = result.recipe;
      let thumbnail: string | null = null;
      let warning: string | null = null;
      if (imported.thumbnailUrl !== null) {
        try {
          thumbnail = await this.#thumbnails.download(imported.thumbnailUrl);
        } catch (error) {
          warning = `No thumbnail: ${message(error)}`;
        }
      }
      try {
        const recipe = this.create(translateImportedToCreateRecipeDto(imported), { thumbnail, reviews: imported.reviews });
        outcomes.push({ url: result.url, recipe, error: null, warning });
      } catch (error) {
        if (thumbnail !== null) {
          await this.#thumbnails.remove(thumbnail);
        }
        outcomes.push({ url: result.url, recipe: null, error: message(error), warning: null });
      }
    }
    return outcomes;
  }

  #validateUrls(dto: ImportRecipesDto): string[] {
    const value: unknown = dto.urls;
    if (!Array.isArray(value)) {
      throw badRequest('"urls" must be a list of URLs');
    }
    const urls: string[] = [];
    for (const item of value as unknown[]) {
      if (typeof item !== 'string') {
        throw badRequest('"urls" must hold only strings');
      }
      const trimmed = item.trim();
      if (trimmed === '') {
        continue;
      }
      let url: URL;
      try {
        url = new URL(trimmed);
      } catch {
        throw badRequest(`"${trimmed}" is no URL`);
      }
      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        throw badRequest(`"${trimmed}" is no http(s) URL`);
      }
      urls.push(trimmed);
    }
    if (urls.length === 0 || urls.length > MAX_IMPORT_URLS) {
      throw badRequest(`"urls" must hold 1 to ${MAX_IMPORT_URLS} URLs`);
    }
    return urls;
  }

  list(filter: RecipeFilterDto, sort: RecipeSortDto, limit: number, offset: number): RecipeSummaryRow[] {
    return this.#recipes.list({ title_contains: filter.search, tag_ids: filter.tags }, { column: sort.sort, order: sort.order }, limit, offset);
  }

  count(filter: RecipeFilterDto): number {
    return this.#recipes.count({ title_contains: filter.search, tag_ids: filter.tags });
  }

  require(id: RecipeId): RecipeDetails {
    const details = this.#recipes.find(id);
    if (!details) {
      throw notFound('Recipe');
    }
    return details;
  }

  create(dto: CreateRecipeDto, extra: { thumbnail: string | null; reviews: ReviewRow[] } = { thumbnail: null, reviews: [] }): RecipeDetails {
    const id = this.#recipes.create(translateDtoToCreateRecipe(this.#validateCreate(dto), extra));
    return this.require(id);
  }

  /** The first rating of an unrated recipe also records that it was cooked now. */
  update(id: RecipeId, dto: EditRecipeDto): RecipeDetails {
    const valid = validatePresent(dto, this.#rules(dto));
    const current = this.require(id).recipe;
    const firstRating = valid.rating !== undefined && valid.rating > 0 && (current.rating ?? 0) === 0;
    this.#recipes.update(id, translateDtoToEditRecipe(valid), firstRating ? { addHistoryAt: new Date().toISOString() } : {});
    return this.require(id);
  }

  async delete(id: RecipeId): Promise<void> {
    this.require(id);
    const thumbnail = this.#recipes.delete(id);
    if (thumbnail !== null) {
      await this.#thumbnails.remove(thumbnail);
    }
  }

  /** Stores the image under a name from the title and drops the one it replaces. */
  async setThumbnail(id: RecipeId, bytes: Uint8Array, type: string): Promise<RecipeDetails> {
    const current = this.require(id).recipe;
    const file = await this.#thumbnails.store(bytes, type, thumbnailName(current.title));
    this.#recipes.update(id, { thumbnail: file });
    if (current.thumbnail !== null && current.thumbnail !== '' && current.thumbnail !== file) {
      await this.#thumbnails.remove(current.thumbnail);
    }
    return this.require(id);
  }

  async removeThumbnail(id: RecipeId): Promise<RecipeDetails> {
    const current = this.require(id).recipe;
    this.#recipes.update(id, { thumbnail: null });
    if (current.thumbnail !== null && current.thumbnail !== '') {
      await this.#thumbnails.remove(current.thumbnail);
    }
    return this.require(id);
  }

  #validateCreate(dto: CreateRecipeDto): Required<CreateRecipeDto> {
    const rules = this.#rules(dto);
    return {
      title: rules.title(),
      flagged: rules.flagged(),
      description: rules.description(),
      source: rules.source(),
      yield: rules.yield(),
      nutrition: rules.nutrition(),
      prepTime: rules.prepTime(),
      cookTime: rules.cookTime(),
      aggregateRating: rules.aggregateRating(),
      rating: rules.rating(),
      ingredients: rules.ingredients(),
      instructions: rules.instructions(),
      history: rules.history(),
      tags: rules.tags(),
    };
  }

  // One rule per field: a create runs them all, an edit only those of the fields present. `nutrition` and `aggregateRating` are replaced whole.
  #rules(dto: EditRecipeDto): { [K in keyof CreateRecipeDto]-?: () => Required<CreateRecipeDto>[K] } {
    return {
      title: () => requiredString(dto, 'title', LIMITS.title),
      flagged: () => (dto.flagged === undefined ? false : requiredBoolean(dto, 'flagged')),
      description: () => optionalString(dto, 'description', LIMITS.description) ?? '',
      source: () => optionalString(dto, 'source', LIMITS.source) ?? '',
      yield: () => optionalNumber(dto, 'yield', { min: Number.MIN_VALUE, max: LIMITS.yield }),
      nutrition: () => this.#validateNutrition(dto.nutrition),
      prepTime: () => (dto.prepTime === undefined ? 0 : requiredNumber(dto, 'prepTime', { min: 0, max: LIMITS.minutes })),
      cookTime: () => (dto.cookTime === undefined ? 0 : requiredNumber(dto, 'cookTime', { min: 0, max: LIMITS.minutes })),
      aggregateRating: () => this.#validateAggregateRating(dto.aggregateRating),
      rating: () => (dto.rating === undefined ? 0 : requiredNumber(dto, 'rating', { min: 0, max: 5 })),
      ingredients: () => stringList(dto, 'ingredients', LIMITS.ingredients),
      instructions: () => stringList(dto, 'instructions', LIMITS.instructions),
      history: () => dateTimeList(dto, 'history', LIMITS.history),
      tags: () => this.#validateTags(dto),
    };
  }

  #validateNutrition(value: unknown): NutritionDto {
    if (value !== undefined && value !== null && !isObject(value)) {
      throw badRequest('"nutrition" must be an object');
    }
    const nutrition = value ?? {};
    const nutrient = (key: keyof NutritionDto): string | null => {
      try {
        return optionalString(nutrition, key, LIMITS.nutrient);
      } catch {
        throw badRequest(`"nutrition.${key}" must be a string of at most ${LIMITS.nutrient} characters`);
      }
    };
    return {
      calories: nutrient('calories'),
      carbohydrate: nutrient('carbohydrate'),
      cholesterol: nutrient('cholesterol'),
      fat: nutrient('fat'),
      fiber: nutrient('fiber'),
      protein: nutrient('protein'),
      saturatedFat: nutrient('saturatedFat'),
      sodium: nutrient('sodium'),
      sugar: nutrient('sugar'),
      transFat: nutrient('transFat'),
      unsaturatedFat: nutrient('unsaturatedFat'),
    };
  }

  #validateAggregateRating(value: unknown): { value: number | null; count: number | null } {
    if (value === undefined || value === null) {
      return { value: null, count: null };
    }
    if (!isObject(value)) {
      throw badRequest('"aggregateRating" must be an object');
    }
    return {
      value: optionalNumber(value, 'value', { min: 0, max: LIMITS.ratingValue }),
      count: optionalNumber(value, 'count', { min: 0, max: LIMITS.ratingCount }),
    };
  }

  // Tags are matched ignoring case, so two spellings of one tag keep the first.
  #validateTags(dto: EditRecipeDto): string[] {
    const seen = new Set<string>();
    return stringList(dto, 'tags', LIMITS.tags).filter((title) => {
      const key = title.toLocaleLowerCase();
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }
}

export function createRecipesFacade(db: DB, config: Config): RecipesFacade {
  return new RecipesFacade(new RecipeRepository(db, createTagFacade(db)), createThumbnailsFacade(config), {
    importConcurrency: config.importConcurrency,
    userAgent: config.userAgent,
  });
}
