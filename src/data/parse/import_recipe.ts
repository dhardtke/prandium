import {
  SchemaAggregateRating,
  SchemaNutritionInformation,
  SchemaReview,
} from "../../deps.ts";
import { Recipe, Review } from "../model/recipe.ts";
import { Tag } from "../model/tag.ts";
import { downloadThumbnail, fetchCustom } from "../util/thumbnails.ts";
import { durationToSeconds, parseDuration } from "./duration.ts";
import { SchemaParser } from "./schema_parser.ts";
import { ensureArray, extractNumber, first } from "./util.ts";

export interface ImportResult {
  url: string;
  success: boolean;
  error?: string;
  recipe?: Recipe;
}

export async function importRecipes(
  urls: string[],
  configDir: string,
): Promise<ImportResult[]> {
  const results: ImportResult[] = [];
  for (const url of urls) {
    const imported = await importRecipe(url.trim(), configDir);
    console.log(imported);
    results.push({
      url,
      success: typeof imported !== "string",
      recipe: typeof imported === "string" ? undefined : imported,
      error: typeof imported === "string" ? imported : undefined,
    });
  }
  return results;
}

export async function importRecipe(
  url: string,
  configDir: string,
): Promise<Recipe | string> {
  let html: string;
  try {
    const response = await fetchCustom(url);
    html = new TextDecoder().decode(
      new Uint8Array(await response.arrayBuffer()),
    );
  } catch (e) {
    return e.toString();
  }
  const parser = new SchemaParser(html);
  const schemaRecipe = parser.findFirstRecipe()!;
  if (!schemaRecipe) {
    return "Recipe metadata not found in HTML.";
  }
  let keywords = ensureArray(
    schemaRecipe.keywords || schemaRecipe.recipeCategory,
  );
  if (keywords.length === 1) {
    keywords = (keywords[0] as string).split(", ");
  }
  const tags: Tag[] | undefined = keywords.map((k) =>
    new Tag({ title: k.toString() })
  );
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
        date: first(review.datePublished)!,
        text: first(review.reviewBody) as string,
      })
    );
  return new Recipe({
    title: first(schemaRecipe.name)!.toString(),
    description: first(schemaRecipe.description)!.toString(),
    tags,
    source: url,
    thumbnail: await downloadThumbnail(
      configDir,
      first(schemaRecipe.image as string),
    ),
    prepTime: schemaRecipe.prepTime
      ? durationToSeconds(parseDuration(schemaRecipe.prepTime.toString()))
      : 0,
    cookTime: schemaRecipe.cookTime
      ? durationToSeconds(parseDuration(schemaRecipe.cookTime.toString()))
      : 0,
    aggregateRatingValue: extractNumber(aggregateRating?.ratingValue as string),
    aggregateRatingCount: first(aggregateRating?.ratingCount),
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
    instructions: ensureArray(schemaRecipe.recipeInstructions).map((i) =>
      i + ""
    ).flatMap((i) => i.split("\n"))
      .map((i) => i.trim()).filter((i) => Boolean(i)),
    reviews,
  });
}
