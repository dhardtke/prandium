import { roundUpToThreeDigits } from "../../../util.ts";
import { parse } from "./parser.js";

export type Quantity = number | { from: number; to: number };

export interface Ingredient {
  quantity: Quantity | null;
  unit: string | null;
  description: string;
}

export const ingredient = {
  /**
   * @param raw the raw ingredient string to parse
   * @param recipeYield the original recipe yield
   * @param portions the desired amount of portions
   */
  parse: (
    raw: string,
    recipeYield = 1,
    portions = 1,
  ): Ingredient => {
    const parsed: Ingredient = parse(raw) as Ingredient;
    if (parsed.quantity) {
      if (typeof parsed.quantity === "object") {
        parsed.quantity.from = roundUpToThreeDigits(
          parsed.quantity.from * (portions / recipeYield),
        );
        parsed.quantity.to = roundUpToThreeDigits(
          parsed.quantity.to * (portions / recipeYield),
        );
      } else {
        parsed.quantity = roundUpToThreeDigits(
          parsed.quantity * (portions / recipeYield),
        );
      }
    }
    return parsed;
  },
  parseMany: (
    ingredients: string[],
    recipeYield = 1,
    portions = 1,
  ): Ingredient[] => {
    const mapped = ingredients
      .map((i) => ingredient.parse(i, recipeYield, portions));
    // sort order: 1. those with quantity & unit, 2. those with only unit, 3. those with neither
    const sortFn = (i: Ingredient) =>
      i.quantity === null ? 3 : i.unit === null ? 2 : 1;
    return mapped.sort((i1, i2) => sortFn(i1) - sortFn(i2));
  },
};
