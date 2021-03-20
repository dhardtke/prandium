import parseIngredient from "https://cdn.skypack.dev/parse-ingredient";
import { roundUpToThreeDigits } from "../../util.ts";

// copied from https://github.com/jakeboone02/parse-ingredient/blob/master/src/index.ts#L3
interface ParsedIngredient {
  /**
   * The primary quantity (the lower quantity in a range, if applicable)
   */
  quantity: number | null;

  /**
   * The secondary quantity (the upper quantity in a range, or `null` if not applicable)
   */
  quantity2: number | null;

  /**
   * The unit of measure
   */
  unitOfMeasure: string | null;

  /**
   * The description
   */
  description: string;

  /**
   * Whether the "ingredient" is actually a group header, e.g. "For icing:"
   */
  isGroupHeader: boolean;

  /**
   * Whether quantity and unit should be separated by a space when rendered out.
   */
  spaceBetweenQuantityAndUnit?: boolean;
}

type AmountType = "full" | "unitless" | "empty";

interface Ingredient {
  /**
   * The amount of the ingredient to use, e.g. "1 cup" or "1-3 table spoons".
   */
  amount?: string;

  /**
   * The description of the ingredient, e.g. "sugar"
   */
  description: string;

  /**
   * What type of information is present in the amount string:
   * full: both unit and numbers are present
   * unitless: no number but a unit is present
   * empty: neither a unit nor a number is present
   */
  amountType: AmountType;
}

const ingredientToWeight = (
  order: AmountType[],
): (ingredient: Ingredient) => number => {
  return (ingredient) => {
    for (let i = order.length - 1; i >= 0; i--) {
      if (ingredient.amountType === order[i]) {
        return i;
      }
    }
    return 0;
  };
};

const SortOrder = {
  ORIGINAL: undefined,
  FULL_UNITLESS_EMPTY: ingredientToWeight(["full", "unitless", "empty"]),
  UNITLESS_EMPTY_FULL: ingredientToWeight(["unitless", "empty", "full"]),
  EMPTY_UNITLESS_FULL: ingredientToWeight(["empty", "unitless", "full"]),
  UNITLESS_FULL_EMPTY: ingredientToWeight(["unitless", "full", "empty"]),
  EMPTY_FULL_UNITLESS: ingredientToWeight(["empty", "full", "unitless"]),
  FULL_EMPTY_UNITLESS: ingredientToWeight(["full", "empty", "unitless"]),
};

export class IngredientHelper {
  public static INSTANCE: IngredientHelper = new IngredientHelper();

  private cache: Map<string, ParsedIngredient | undefined> = new Map();

  private constructor() {
  }

  private static parse(raw: string): ParsedIngredient | undefined {
    const candidates: ParsedIngredient[] = parseIngredient(raw, {
      normalizeUOM: false,
    });
    const parsed = candidates.find((c) => !c.isGroupHeader);
    // manual post-processing
    if (parsed) {
      // TODO make configurable
      if (!parsed.unitOfMeasure) {
        const postprocessing = ["TL", "EL", "dl", "kl.", "gr."];
        const match = postprocessing.find((prefix) =>
          parsed.description.startsWith(prefix)
        );
        if (match) {
          parsed.unitOfMeasure = parsed.description.substr(0, match.length);
          parsed.description = parsed.description.substr(match.length);
          parsed.spaceBetweenQuantityAndUnit = true;
        }
      }
      // cleanup
      if (parsed.description.startsWith(", ")) {
        parsed.description = parsed.description.substr(2);
      }
    }
    return parsed;
  }

  /**
   * @param raw the raw ingredient string to parse
   * @param recipeYield the original recipe yield
   * @param portions the desired amount of portions
   */
  public ingredient = (
    raw: string,
    recipeYield = 1,
    portions = 1,
  ): Ingredient => {
    if (!this.cache.has(raw)) {
      const parsed = IngredientHelper.parse(raw);
      this.cache.set(raw, parsed);
    }
    const cached = this.cache.get(raw)!;
    const computed = {
      quantity: cached.quantity
        ? roundUpToThreeDigits(cached.quantity * (portions / recipeYield))
        : null,
      quantity2: cached.quantity2
        ? roundUpToThreeDigits(cached.quantity2 * (portions / recipeYield))
        : null,
    };

    return {
      amount: computed.quantity
        ? `${computed.quantity}${
          computed.quantity2 ? `- ${computed.quantity2}` : ""
        }${
          cached.spaceBetweenQuantityAndUnit ? " " : ""
        }${cached.unitOfMeasure ?? ""}`
        : undefined,
      description: cached.description.trim(),
      amountType: cached.quantity
        ? (cached.unitOfMeasure ? "full" : "unitless")
        : "empty",
    };
  };

  public sortedIngredients(
    ingredients: string[],
    recipeYield = 1,
    portions = 1,
    sortOrder = SortOrder.FULL_UNITLESS_EMPTY,
  ): Ingredient[] {
    // TODO add configuration option for ingredient sorting
    return ingredients
      .map((i) => this.ingredient(i, recipeYield, portions))
      .sort(
        sortOrder
          ? (i1, i2) => {
            // @ts-ignore sortOrder can not be null or undefined here
            return sortOrder(i1) - sortOrder(i2);
          }
          : undefined,
      );
  }

  public api = {
    ingredient: this.ingredient,
    ingredients: this.sortedIngredients,
  };
}
