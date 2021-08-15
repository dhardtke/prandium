import { assertEquals } from "../../../deps.ts";
import { Ingredient, ingredient } from "../../../src/data/util/ingredient.ts";
import { IngredientSortOrder } from "../../../src/settings.ts";

Deno.test(`ingredient.parse`, () => {
  const tests: { raw: string, recipeYield?: number, portions?: number, expected: Ingredient }[] = [
    {
      raw: "", expected: { amount: undefined, amountType: "empty", description: undefined }
    },
    {
      raw: "10 tomatoes", expected: { amount: "10", amountType: "unitless", description: "tomatoes" }
    },
    {
      raw: "1 cup of rice", expected: { amount: "1cup", amountType: "full", description: "of rice" }
    },
    {
      raw: "10g sugar", expected: { amount: "10g", amountType: "full", description: "sugar" }
    },
    {
      raw: "10-20g Zucker", expected: { amount: "10 - 20g", amountType: "full", description: "Zucker" }
    },
    {
      raw: "salt", expected: { amount: undefined, amountType: "empty", description: "salt" }
    }
  ];
  for (const { raw, recipeYield, portions, expected } of tests) {
    assertEquals(ingredient.parse(raw, recipeYield, portions), expected);
  }
});

Deno.test(`ingredient.parse with unknown unit (without postprocessing)`, () => {
  ingredient.initialize(IngredientSortOrder.Original, []);
  assertEquals(ingredient.parse("2 TL Salz"), { amount: "2", amountType: "unitless", description: "TL Salz" });
});

Deno.test(`ingredient.parse with unknown unit (with postprocessing)`, () => {
  ingredient.initialize(IngredientSortOrder.Original, ["TL"]);
  assertEquals(ingredient.parse("2 TL Salz"), { amount: "2 TL", amountType: "full", description: "Salz" });
});

Deno.test(`ingredient.parseMany sort modes`, () => {
  const types = {
    full: { raw: "10g salt", parsed: { amount: "10g", amountType: "full", description: "salt" } },
    unitless: { raw: "10 tomatoes", parsed: { amount: "10", amountType: "unitless", description: "tomatoes" } },
    empty: { raw: "salt", parsed: { amount: undefined, amountType: "empty", description: "salt" } },
  };
  const permutations = [
    [types.full, types.unitless, types.empty],
    [types.full, types.empty, types.unitless],
    [types.unitless, types.full, types.empty],
    [types.unitless, types.empty, types.full],
    [types.empty, types.full, types.unitless],
    [types.empty, types.unitless, types.full],
  ];

  const tests = [
    {
      sortOrder: IngredientSortOrder.Original,
      expected: "original"
    },
    {
      sortOrder: IngredientSortOrder.FullUnitlessEmpty,
      expected: [types.full, types.unitless, types.empty]
    },
    {
      sortOrder: IngredientSortOrder.UnitlessEmptyFull,
      expected: [types.unitless, types.empty, types.full]
    },
    {
      sortOrder: IngredientSortOrder.EmptyUnitlessFull,
      expected: [types.empty, types.unitless, types.full]
    },
    {
      sortOrder: IngredientSortOrder.UnitlessFullEmpty,
      expected: [types.unitless, types.full, types.empty]
    },
    {
      sortOrder: IngredientSortOrder.EmptyFullUnitless,
      expected: [types.empty, types.full, types.unitless]
    },
    {
      sortOrder: IngredientSortOrder.FullEmptyUnitless,
      expected: [types.full, types.empty, types.unitless]
    },
  ];
  for (const { sortOrder, expected } of tests) {
    ingredient.initialize(sortOrder, []);
    for (const permutation of permutations) {
      const actual = ingredient.parseMany(permutation.map(i => i.raw));
      if (expected === "original") {
        assertEquals(actual, permutation.map(e => e.parsed));
      } else if (Array.isArray(expected)) {
        assertEquals(actual, expected.map(e => e.parsed));
      }
    }
  }
});

Deno.test(`ingredient.parse amount calculation`, () => {
  const tests = [
    { raw: "10g salt", recipeYield: 1, portions: 1, expectedAmount: "10g" },
    { raw: "10g salt", recipeYield: 2, portions: 1, expectedAmount: "5g" },
    { raw: "10g salt", recipeYield: 5, portions: 1, expectedAmount: "2g" },
    { raw: "10g salt", recipeYield: 1, portions: 2, expectedAmount: "20g" },
    { raw: "10g salt", recipeYield: 2, portions: 2, expectedAmount: "10g" },
    { raw: "10g salt", recipeYield: 5, portions: 10, expectedAmount: "20g" },
  ];
  for (const { raw, recipeYield, portions, expectedAmount } of tests) {
    assertEquals(ingredient.parse(raw, recipeYield, portions).amount, expectedAmount);
  }
});
