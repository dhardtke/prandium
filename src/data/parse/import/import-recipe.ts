import { pooledMap, SchemaAggregateRating, SchemaNutritionInformation, SchemaRecipe, SchemaReview } from "../../../../deps.ts";
import { Recipe, Review } from "../../model/recipe.ts";
import { Tag } from "../../model/tag.ts";
import { fetchCustom, FetchFn } from "../../util/fetch.ts";
import { downloadThumbnail } from "../../util/thumbnails.ts";
import { durationToMinutes, parseDuration } from "../duration.ts";
import { ParseHtmlToSchema, SchemaParser } from "../schema-parser.ts";
import { ensureArray, extractNumber, first } from "../util.ts";

export interface ImportResult {
    url: string;
    success: boolean;
    error?: string;
    recipe?: Recipe;
}

type Instruction = string | { text?: string; name?: string };

function parseInstructions(
    instructions: Instruction[],
): string[] {
    return instructions
        .flatMap((i) => typeof i === "string" ? i.split("\n") : [i.text || i.name])
        .map((i) => i?.trim())
        .filter(Boolean) as string[];
}

function parseKeywordsToTags(schemaRecipe: SchemaRecipe): Tag[] {
    let keywords = ensureArray<string>(
        schemaRecipe.keywords || schemaRecipe.recipeCategory,
    );
    if (keywords.length === 1) {
        keywords = keywords[0].split(/, ?/);
    }
    return keywords
        .map((t) => t?.trim())
        .filter(Boolean)
        .map((k) => new Tag({ title: k.toString() }));
}

function parseReviews(schemaRecipe: SchemaRecipe): Review[] {
    return ensureArray<SchemaReview>(schemaRecipe.review || schemaRecipe.reviews)
        .filter((r) => Boolean(r.reviewBody))
        .map((review) =>
            new Review({
                date: first<string | Date>(review.datePublished),
                text: first<string>(review.reviewBody)!.trim(),
            })
        );
}

async function mapSchemaRecipe(schemaRecipe: SchemaRecipe, url: string, configDir: string, userAgent: string, fetchFn?: FetchFn): Promise<Recipe> {
    const tags = parseKeywordsToTags(schemaRecipe);
    const nutrition = first<SchemaNutritionInformation>(schemaRecipe.nutrition);
    const aggregateRating = first<SchemaAggregateRating>(schemaRecipe.aggregateRating);
    const reviews = parseReviews(schemaRecipe);

    return new Recipe({
        tags,
        reviews,
        thumbnail: await downloadThumbnail(
            configDir,
            userAgent,
            first(schemaRecipe.image as string),
            fetchFn,
        ),
        title: first<string>(schemaRecipe.name),
        description: first<string>(schemaRecipe.description),
        source: url,
        prepTime: schemaRecipe.prepTime ? durationToMinutes(parseDuration(schemaRecipe.prepTime.toString())) : 0,
        cookTime: schemaRecipe.cookTime ? durationToMinutes(parseDuration(schemaRecipe.cookTime.toString())) : 0,
        aggregateRatingValue: extractNumber(aggregateRating?.ratingValue as string),
        aggregateRatingCount: first<number>(aggregateRating?.ratingCount),
        ingredients: ensureArray<string>(schemaRecipe.recipeIngredient || schemaRecipe.ingredients).map((i) => i.toString()),
        yield: extractNumber(first<number>(schemaRecipe?.recipeYield || schemaRecipe?.yield)?.toString()),
        nutritionCalories: first<string>(nutrition?.calories),
        nutritionCarbohydrate: first<string>(nutrition?.carbohydrateContent),
        nutritionCholesterol: first<string>(nutrition?.cholesterolContent),
        nutritionFat: first<string>(nutrition?.fatContent),
        nutritionFiber: first<string>(nutrition?.fiberContent),
        nutritionProtein: first<string>(nutrition?.proteinContent),
        nutritionSaturatedFat: first<string>(nutrition?.saturatedFatContent),
        nutritionSodium: first<string>(nutrition?.sodiumContent),
        nutritionSugar: first<string>(nutrition?.sugarContent),
        nutritionTransFat: first<string>(nutrition?.transFatContent),
        nutritionUnsaturatedFat: first<string>(nutrition?.unsaturatedFatContent),
        instructions: parseInstructions(ensureArray<Instruction>(schemaRecipe.recipeInstructions)),
    });
}

async function fetchHtml(url: string, userAgent: string, fetchFn = fetchCustom): Promise<string> {
    const response = await fetchFn(url, userAgent);
    return new TextDecoder().decode(
        new Uint8Array(await response.arrayBuffer()),
    );
}

async function importRecipe(
    url: string,
    configDir: string,
    userAgent: string,
    fetchFn: FetchFn = fetchCustom,
    parserFactory: (html: string) => ParseHtmlToSchema = (html) => new SchemaParser(html),
): Promise<Recipe> {
    const html = await fetchHtml(url, userAgent, fetchFn);
    const parser = parserFactory(html);
    const schemaRecipe = parser.findFirstRecipe()!;
    if (!schemaRecipe) {
        throw new Error("Recipe metadata not found in HTML.");
    }

    return await mapSchemaRecipe(schemaRecipe, url, configDir, userAgent, fetchFn);
}

async function importFromUrl(
    url: string,
    configDir: string,
    userAgent: string,
    fetchFn: FetchFn = fetchCustom,
    parserFactory: (html: string) => ParseHtmlToSchema = (html) => new SchemaParser(html),
): Promise<ImportResult> {
    let response: ImportResult;
    try {
        const recipe = await importRecipe(url, configDir, userAgent, fetchFn, parserFactory);
        response = {
            url: url,
            success: true,
            recipe: recipe,
        };
    } catch (error) {
        response = {
            url: url,
            success: false,
            error: error instanceof Error ? error.message : `${error}`,
        };
    }
    return response;
}

export async function importRecipes(
    args: {
        urls: string[];
        configDir: string;
        importConcurrency: number;
        userAgent: string;
        fetchFn?: FetchFn;
        parserFactory?: (html: string) => ParseHtmlToSchema;
    },
): Promise<ImportResult[]> {
    const results: ImportResult[] = [];

    const concurrency = Math.min(
        args.urls.length,
        args.importConcurrency,
    );

    const importResults = pooledMap(
        concurrency,
        args.urls,
        (url: string) => importFromUrl(url, args.configDir, args.userAgent, args.fetchFn, args.parserFactory),
    );

    for await (const result of importResults) {
        results.push(result);
    }

    return results;
}
