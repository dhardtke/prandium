import { assertEquals } from "../../../../deps.ts";
import {
  Ingredient,
  ingredient,
} from "../../../../src/data/parse/ingredient/mod.ts";

Deno.test(`ingredient.parse`, () => {
  const tests: { input: string; output: Ingredient }[] = [
    {
      input: "Salz, Pfeffer",
      output: { unit: null, quantity: null, description: "Salz, Pfeffer" },
    },
    {
      input: "1g Salz",
      output: { quantity: 1, unit: "g", description: "Salz" },
    },
    {
      input: "2½ EL Zucker",
      output: { quantity: 2.5, unit: "EL", description: "Zucker" },
    },
    {
      input: "2 ½ EL Zucker",
      output: { quantity: 2.5, unit: "EL", description: "Zucker" },
    },
    {
      input: "⅕ Apfel",
      output: { quantity: 1 / 5, unit: null, description: "Apfel" },
    },
    {
      input: "1 g Salz",
      output: { quantity: 1, unit: "g", description: "Salz" },
    },
    {
      input: "1 TL Zucker",
      output: { quantity: 1, unit: "TL", description: "Zucker" },
    },
    {
      input: "1 l Wasser",
      output: { quantity: 1, unit: "l", description: "Wasser" },
    },
    {
      input: "1 L Wasser",
      output: { quantity: 1, unit: "L", description: "Wasser" },
    },
    {
      input: "2 Esslöffel Pfeffer",
      output: { quantity: 2, unit: "Esslöffel", description: "Pfeffer" },
    },
    {
      input: "4kg Nudeln",
      output: { quantity: 4, unit: "kg", description: "Nudeln" },
    },
    {
      input: "4 kg Nudeln",
      output: { quantity: 4, unit: "kg", description: "Nudeln" },
    },
    {
      input: "1-2 Teelöffel Kümmel",
      output: {
        quantity: { from: 1, to: 2 },
        unit: "Teelöffel",
        description: "Kümmel",
      },
    },
    {
      input: "1 - 2 Teelöffel Kümmel",
      output: {
        quantity: { from: 1, to: 2 },
        unit: "Teelöffel",
        description: "Kümmel",
      },
    },
    {
      input: "4 große Paprika",
      output: { quantity: 4, unit: null, description: "große Paprika" },
    },
    {
      input: "0.5 Kalbsfond",
      output: { quantity: .5, unit: null, description: "Kalbsfond" }
    },
  ];
  for (const { input, output } of tests) {
    assertEquals(ingredient.parse(input), output);
  }
});

Deno.test(`ingredient.parse quantity calculation`, () => {
  const tests: {
    raw: string;
    recipeYield: number;
    portions: number;
    expectedQuantity: number;
  }[] = [
    { raw: "10g salt", recipeYield: 1, portions: 1, expectedQuantity: 10 },
    { raw: "10g salt", recipeYield: 2, portions: 1, expectedQuantity: 5 },
    { raw: "10g salt", recipeYield: 5, portions: 1, expectedQuantity: 2 },
    { raw: "10g salt", recipeYield: 1, portions: 2, expectedQuantity: 20 },
    { raw: "10g salt", recipeYield: 2, portions: 2, expectedQuantity: 10 },
    { raw: "10g salt", recipeYield: 5, portions: 10, expectedQuantity: 20 },
  ];
  for (const { raw, recipeYield, portions, expectedQuantity } of tests) {
    assertEquals(
      ingredient.parse(raw, recipeYield, portions).quantity,
      expectedQuantity,
    );
  }
});

Deno.test(`ingredient.parse with invalid strings`, () => {
  ingredient.parse("");
  ingredient.parse("abc");
  ingredient.parse("0");
  ingredient.parse("42");
  ingredient.parse("1 /");
});

Deno.test(`ingredient.parseMany`, () => {
  const tests: {
    raw: string;
    recipeYield: number;
    portions: number;
    expectedQuantity: number;
  }[] = [
    { raw: "10g salt", recipeYield: 1, portions: 1, expectedQuantity: 10 },
    { raw: "10g salt", recipeYield: 2, portions: 1, expectedQuantity: 5 },
    { raw: "10g salt", recipeYield: 5, portions: 1, expectedQuantity: 2 },
    { raw: "10g salt", recipeYield: 1, portions: 2, expectedQuantity: 20 },
    { raw: "10g salt", recipeYield: 2, portions: 2, expectedQuantity: 10 },
    { raw: "10g salt", recipeYield: 5, portions: 10, expectedQuantity: 20 },
  ];
  for (const { raw, recipeYield, portions, expectedQuantity } of tests) {
    assertEquals(
      ingredient.parse(raw, recipeYield, portions).quantity,
      expectedQuantity,
    );
  }
});
