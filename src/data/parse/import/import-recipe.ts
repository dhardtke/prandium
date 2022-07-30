import { pooledMap, SchemaAggregateRating, SchemaNutritionInformation, SchemaRecipe, SchemaReview } from "../../../../deps.ts";
import { Recipe, Review } from "../../model/recipe.ts";
import { Tag } from "../../model/tag.ts";
import { fetchCustom, FetchFn } from "../../util/fetch.ts";
import { downloadThumbnail } from "../../util/thumbnails.ts";
import { durationToSeconds, parseDuration } from "../duration.ts";
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
    return instructions.flatMap((i) => typeof i === "string" ? i.split("\n") : [i.text || i.name]).filter(Boolean) as string[];
}

async function fetchHtml(url: string, userAgent: string, fetchFn = fetchCustom): Promise<string> {
    const response = await fetchFn(url, userAgent);
    return new TextDecoder().decode(
        new Uint8Array(await response.arrayBuffer()),
    );
}

async function mapSchemaRecipe(schemaRecipe: SchemaRecipe, url: string, configDir: string, userAgent: string, fetchFn?: FetchFn): Promise<Recipe> {
    let keywords = ensureArray(
        schemaRecipe.keywords || schemaRecipe.recipeCategory,
    );
    if (keywords.length === 1) {
        keywords = (keywords[0] as string).split(", ");
    }
    const tags: Tag[] | undefined = keywords.map((k) => new Tag({ title: k.toString() }));
    // TODO check for idreferences and throw
    // TODO type check? and warnings? (e.g. strings must be strings, etc.)
    const nutrition = first(schemaRecipe.nutrition) as SchemaNutritionInformation;
    const aggregateRating = first(
        schemaRecipe.aggregateRating,
    ) as SchemaAggregateRating;
    const reviews = ensureArray(
        schemaRecipe.review as SchemaReview || schemaRecipe.reviews,
    )
        .map((review) =>
            new Review({
                date: first(review.datePublished) as string | Date,
                text: first(review.reviewBody) as string,
            })
        )
        .filter((review) => Boolean(review.text));

    return new Recipe({
        title: first(schemaRecipe.name)?.toString(),
        description: first(schemaRecipe.description)?.toString(),
        tags,
        source: url,
        thumbnail: await downloadThumbnail(
            configDir,
            userAgent,
            first(schemaRecipe.image as string),
            fetchFn,
        ),
        prepTime: schemaRecipe.prepTime ? durationToSeconds(parseDuration(schemaRecipe.prepTime.toString())) : 0,
        cookTime: schemaRecipe.cookTime ? durationToSeconds(parseDuration(schemaRecipe.cookTime.toString())) : 0,
        aggregateRatingValue: extractNumber(aggregateRating?.ratingValue as string),
        aggregateRatingCount: first(aggregateRating?.ratingCount as number),
        ingredients: ensureArray(
            schemaRecipe.recipeIngredient || schemaRecipe.ingredients,
        ).map((i) => i + ""),
        yield: extractNumber(
            first(schemaRecipe?.recipeYield || schemaRecipe?.yield)?.toString(),
        ),
        nutritionCalories: first(nutrition?.calories) as string,
        nutritionCarbohydrate: first(nutrition?.carbohydrateContent) as string,
        nutritionCholesterol: first(nutrition?.cholesterolContent) as string,
        nutritionFat: first(nutrition?.fatContent) as string,
        nutritionFiber: first(nutrition?.fiberContent) as string,
        nutritionProtein: first(nutrition?.proteinContent) as string,
        nutritionSaturatedFat: first(nutrition?.saturatedFatContent) as string,
        nutritionSodium: first(nutrition?.sodiumContent) as string,
        nutritionSugar: first(nutrition?.sugarContent) as string,
        nutritionTransFat: first(nutrition?.transFatContent) as string,
        nutritionUnsaturatedFat: first(nutrition?.unsaturatedFatContent) as string,
        instructions: parseInstructions(
            ensureArray(schemaRecipe.recipeInstructions) as Instruction[],
        )
            .map((i) => i.trim()).filter((i) => Boolean(i)),
        reviews,
    });
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
    // TODO treat every field as if it was undefined
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
            error: error instanceof Error ? error.message : error.toString(),
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
