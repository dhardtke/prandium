import { beforeEach, describe, expect, test } from "bun:test";
import type { Recipe as SchemaRecipe } from "schema-dts";
import { Recipe } from "../../../../src/data/model/recipe.ts";
import { importRecipes } from "../../../../src/data/parse/import/import-recipe.ts";
import { ParseHtmlToSchema } from "../../../../src/data/parse/schema-parser.ts";
import { FetchFn } from "../../../../src/data/util/fetch.ts";
import { withTemp } from "../../../_internal/with-temp.function.ts";

describe("importRecipes", () => {
    let fetchCalls: { url: string; userAgent: string }[] = [];
    let fetchShouldReturn: { [url: string]: boolean } = {};
    let parsedRecipes: { [html: string]: SchemaRecipe | null } = {};
    const parserFactory: (html: string) => ParseHtmlToSchema = (html) => {
        return {
            findFirstRecipe(): SchemaRecipe | null {
                return parsedRecipes[html];
            },
        };
    };

    beforeEach(() => {
        fetchCalls = [];
        fetchShouldReturn = {};
        parsedRecipes = {};
    });

    const mockedFetchFn: FetchFn = (input, userAgent): Promise<Response> => {
        const url = input as string;
        fetchCalls.push({ url, userAgent });

        const shouldReturn = fetchShouldReturn[url];
        if (!shouldReturn) {
            return Promise.reject(`Can't fetch URL ${url}.`);
        } else {
            return Promise.resolve({
                arrayBuffer: () => {
                    const enc = new TextEncoder();
                    return enc.encode(url);
                },
            } as unknown as Response);
        }
    };

    /**
     * Imports a single recipe whose schema has `schemaField` set to `given` and expects `Recipe#recipeField` to match `then`.
     */
    function simpleTest(given: unknown, then: unknown, schemaField: string, recipeField: string): () => Promise<void> {
        return withTemp(async (tmpDir) => {
            // Given
            parsedRecipes.url = {
                [schemaField]: given,
            } as unknown as SchemaRecipe;
            fetchShouldReturn.url = true;

            // When
            const result = await importRecipes({
                urls: ["url"],
                configDir: tmpDir,
                importConcurrency: 1,
                userAgent: "My User Agent",
                fetchFn: mockedFetchFn,
                parserFactory: parserFactory,
            });

            // Then
            const [imported] = result;
            expect(result.length).toEqual(1);
            expect(imported).toMatchObject({
                recipe: {
                    [recipeField]: then,
                },
            });
        });
    }

    test(
        "Given no urls Then the result is empty",
        withTemp(async (tmpDir) => {
            // Given & When
            const importResult = await importRecipes({
                urls: [],
                configDir: tmpDir,
                importConcurrency: 1,
                userAgent: "",
                fetchFn: mockedFetchFn,
            });

            // Then
            expect(importResult).toEqual([]);
        }),
    );

    test(
        "Given one URL Then fetch is called once with exactly that URL",
        withTemp(async (tmpDir) => {
            // Given & When
            await importRecipes({
                urls: ["https://example.com"],
                configDir: tmpDir,
                importConcurrency: 1,
                userAgent: "My User Agent",
                fetchFn: mockedFetchFn,
            });

            // Then
            expect(fetchCalls).toEqual([{ url: "https://example.com", userAgent: "My User Agent" }]);
        }),
    );

    test(
        "Given url1 and url2 When fetching url1 returns an error Then url2 is still imported",
        withTemp(async (tmpDir) => {
            // Given
            fetchShouldReturn.url1 = false;
            fetchShouldReturn.url2 = true;
            parsedRecipes.url2 = {} as SchemaRecipe;

            // When
            const result = await importRecipes({
                urls: ["url1", "url2"],
                configDir: tmpDir,
                importConcurrency: 1,
                userAgent: "My User Agent",
                fetchFn: mockedFetchFn,
                parserFactory: parserFactory,
            });

            // Then
            const [recipe1, recipe2] = result;
            expect(result.length).toEqual(2);
            expect(recipe1).toEqual({ url: "url1", success: false, error: "Can't fetch URL url1." });
            expect(recipe2).toMatchObject({
                url: "url2",
                success: true,
                recipe: {
                    source: "url2",
                } as Recipe,
            });
        }),
    );

    test(
        "When no Recipe is detected in the HTML of the given URL Then the result contains the correct error",
        withTemp(async (tmpDir) => {
            // Given
            fetchShouldReturn.url = true;
            parsedRecipes.url = null;

            // When
            const result = await importRecipes({
                urls: ["url"],
                configDir: tmpDir,
                importConcurrency: 1,
                userAgent: "My User Agent",
                fetchFn: mockedFetchFn,
                parserFactory: parserFactory,
            });

            // Then
            expect(result).toEqual([
                { url: "url", success: false, error: "Recipe metadata not found in HTML." },
            ]);
        }),
    );

    test(
        "When every field of the Recipe in the HTML is unset Then the result does not contain any fields either",
        withTemp(async (tmpDir) => {
            // Given
            parsedRecipes.url = {} as SchemaRecipe;
            fetchShouldReturn.url = true;

            // When
            const result = await importRecipes({
                urls: ["url"],
                configDir: tmpDir,
                importConcurrency: 1,
                userAgent: "My User Agent",
                fetchFn: mockedFetchFn,
                parserFactory: parserFactory,
            });

            // Then
            const [imported] = result;
            expect(result.length).toEqual(1);
            expect(imported).toMatchObject({
                url: "url",
                success: true,
                recipe: {
                    source: "url",
                } as Recipe,
            });
        }),
    );

    describe("parsing instructions", () => {
        test.each<[unknown, string[]]>([
            [["instruction1", "instruction2"], ["instruction1", "instruction2"]],
            [["   instruction1   "], ["instruction1"]],
            ["instruction1\ninstruction2\ninstruction3", ["instruction1", "instruction2", "instruction3"]],
            ["", []],
        ])("Given %j Then Recipe#instructions=%j", (given, then) => simpleTest(given, then, "recipeInstructions", "instructions")());
    });

    describe("parsing tags", () => {
        describe.each(["keywords", "recipeCategory"])("schema field is %s", (field) => {
            test.each<[unknown, string[]]>([
                [["tag1", "tag2"], ["tag1", "tag2"]],
                [["   tag1   "], ["tag1"]],
                ["tag1,tag2,tag3", ["tag1", "tag2", "tag3"]],
                ["", []],
                ["tag1, tag2, tag3", ["tag1", "tag2", "tag3"]],
                [["tag1, tag2, tag3", "tag4"], ["tag1, tag2, tag3", "tag4"]],
            ])("Given %j Then Recipe#tags have the titles %j", (given, then) => simpleTest(given, then.map((title) => ({ title })), field, "tags")());
        });
    });

    describe("parsing reviews", () => {
        describe.each(["reviews", "review"])("schema field is %s", (field) => {
            test.each<[unknown, unknown[]]>([
                [{ datePublished: "1970-01-01T00:00:00.000Z", reviewBody: "review" }, [{ date: new Date("1970-01-01T00:00:00.000Z"), text: "review" }]],
                [
                    { datePublished: "1970-01-01T00:00:00.000Z", reviewBody: "  review    " },
                    [
                        {
                            date: new Date("1970-01-01T00:00:00.000Z"),
                            text: "review",
                        },
                    ],
                ],
                [{ datePublished: "1970-01-01T00:00:00.000Z", reviewBody: "  " }, []],
            ])("Given %j Then Recipe#reviews=%j", (given, then) => simpleTest(given, then, field, "reviews")());
        });
    });

    describe("parsing nutritional values", () => {
        test.each([
            ["calories", "nutritionCalories"],
            ["carbohydrateContent", "nutritionCarbohydrate"],
            ["cholesterolContent", "nutritionCholesterol"],
            ["fatContent", "nutritionFat"],
            ["fiberContent", "nutritionFiber"],
            ["proteinContent", "nutritionProtein"],
            ["saturatedFatContent", "nutritionSaturatedFat"],
            ["sodiumContent", "nutritionSodium"],
            ["sugarContent", "nutritionSugar"],
            ["transFatContent", "nutritionTransFat"],
            ["unsaturatedFatContent", "nutritionUnsaturatedFat"],
        ])("Given nutrition.%s Then Recipe#%s is set", (schemaField, recipeField) =>
            simpleTest({ [schemaField]: "my nutritional value" }, "my nutritional value", "nutrition", recipeField)());
    });

    test("parsing prepTime", simpleTest("PT20M", 20, "prepTime", "prepTime"));

    test("parsing cookTime", simpleTest("PT25M", 25, "cookTime", "cookTime"));

    // TODO test yield
    // TODO test rating
    // TODO test thumbnail
    // TODO test title / description
});
