import { assertEquals, assertObjectMatch } from "../../../../deps-test.ts";
import { SchemaRecipe } from "../../../../deps.ts";
import { Recipe } from "../../../../src/data/model/recipe.ts";
import { importRecipes } from "../../../../src/data/parse/import/import-recipe.ts";
import { ParseHtmlToSchema } from "../../../../src/data/parse/schema-parser.ts";
import { FetchFn } from "../../../../src/data/util/fetch.ts";
import { withTemp } from "../../../_internal/with-temp.function.ts";

Deno.test("importRecipes", async (t) => {
  let fetchCalls: { url: string, userAgent: string }[] = [];
  let fetchShouldReturn: { [url: string]: boolean } = {};
  let parsedRecipes: { [html: string]: SchemaRecipe | null } = {};
  const parserFactory: (html: string) => ParseHtmlToSchema = (html) => {
    return {
      findFirstRecipe(): SchemaRecipe | null {
        return parsedRecipes[html];
      }
    };
  };

  function beforeEach() {
    fetchCalls = [];
    fetchShouldReturn = {};
    parsedRecipes = {};
  }

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
        }
      } as unknown as Response);
    }
  };

  beforeEach();
  await t.step("Given no urls Then the result is empty", withTemp(async (tmpDir) => {
    // Given & When
    const importResult = await importRecipes({
      urls: [],
      configDir: tmpDir,
      importConcurrency: 1,
      userAgent: "",
      fetchFn: mockedFetchFn
    });

    // Then
    assertEquals(importResult, []);
  }));

  beforeEach();
  await t.step("Given one URL Then fetch is called once with exactly that URL", withTemp(async (tmpDir) => {
    // Given & When
    await importRecipes({
      urls: ["https://example.com"],
      configDir: tmpDir,
      importConcurrency: 1,
      userAgent: "My User Agent",
      fetchFn: mockedFetchFn
    });

    // Then
    assertEquals(fetchCalls, [{ url: "https://example.com", userAgent: "My User Agent" }]);
  }));

  beforeEach();
  await t.step("Given url1 and url2 When fetching url1 returns an error Then url2 is still imported", withTemp(async (tmpDir) => {
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
      parserFactory: parserFactory
    });

    // Then
    const [recipe1, recipe2] = result;
    assertEquals(result.length, 2);
    assertEquals(recipe1, { url: "url1", success: false, error: "Can't fetch URL url1." });
    assertObjectMatch(recipe2, {
      url: "url2",
      success: true,
      recipe: {
        source: "url2"
      } as Recipe
    });
  }));

  beforeEach();
  await t.step("When no Recipe is detected in the HTML of the given URL Then the result contains the correct error", withTemp(async (tmpDir) => {
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
      parserFactory: parserFactory
    });

    // Then
    assertEquals(result, [
      { url: "url", success: false, error: "Recipe metadata not found in HTML." }
    ]);
  }));

  beforeEach();
  await t.step("When every field of the Recipe in the HTML is unset Then the result does not contain any fields either", withTemp(async (tmpDir) => {
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
      parserFactory: parserFactory
    });

    // Then
    const [imported] = result;
    assertEquals(result.length, 1);
    assertObjectMatch(imported, {
      url: "url",
      success: true,
      recipe: {
        source: "url"
      } as Recipe
    });
  }));
});
