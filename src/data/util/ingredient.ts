import { parseIngredient } from "../../../deps.ts";
import { IngredientSortOrder } from "../../settings.ts";
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

export interface Ingredient {
  /**
   * The amount of the ingredient to use, e.g. "1 cup" or "1-3 table spoons".
   */
  amount?: string;

  /**
   * The description of the ingredient, e.g. "sugar"
   */
  description?: string;

  /**
   * What type of information is present in the amount string:
   * full: both unit and numbers are present
   * unitless: no number but a unit is present
   * empty: neither a unit nor a number is present
   */
  amountType: AmountType;
}

type IngredientWeightFunction = (i: Ingredient) => number;

const ingredientToWeightFn = (
  order: AmountType[],
): IngredientWeightFunction => {
  return (ingredient) => {
    for (let i = order.length - 1; i >= 0; i--) {
      if (ingredient.amountType === order[i]) {
        return i;
      }
    }
    return 0;
  };
};

const SortOrder: Record<
  IngredientSortOrder,
  IngredientWeightFunction | undefined
> = {
  [IngredientSortOrder.Original]: undefined,
  [IngredientSortOrder.FullUnitlessEmpty]: ingredientToWeightFn([
    "full",
    "unitless",
    "empty",
  ]),
  [IngredientSortOrder.UnitlessEmptyFull]: ingredientToWeightFn([
    "unitless",
    "empty",
    "full",
  ]),
  [IngredientSortOrder.EmptyUnitlessFull]: ingredientToWeightFn([
    "empty",
    "unitless",
    "full",
  ]),
  [IngredientSortOrder.UnitlessFullEmpty]: ingredientToWeightFn([
    "unitless",
    "full",
    "empty",
  ]),
  [IngredientSortOrder.EmptyFullUnitless]: ingredientToWeightFn([
    "empty",
    "full",
    "unitless",
  ]),
  [IngredientSortOrder.FullEmptyUnitless]: ingredientToWeightFn([
    "full",
    "empty",
    "unitless",
  ]),
};

let sortOrder: IngredientSortOrder = IngredientSortOrder.Original;
let unitPostprocessing: string[] = [];

function _parse(raw: string): ParsedIngredient | undefined {
  const candidates: ParsedIngredient[] = parseIngredient(raw, {
    normalizeUOM: false,
  });
  const parsed = candidates.find((c) => !c.isGroupHeader);
  // manual post-processing
  if (parsed) {
    if (!parsed.unitOfMeasure) {
      const match = unitPostprocessing.find((prefix) =>
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

export const ingredient = {
  initialize: (
    _sortOrder: IngredientSortOrder,
    _unitPostprocessing: string[],
  ) => {
    sortOrder = _sortOrder;
    unitPostprocessing = _unitPostprocessing;
  },
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
    const parsed = _parse(raw);
    const computed = {
      quantity: parsed?.quantity
        ? roundUpToThreeDigits(parsed.quantity * (portions / recipeYield))
        : null,
      quantity2: parsed?.quantity2
        ? roundUpToThreeDigits(parsed.quantity2 * (portions / recipeYield))
        : null,
    };

    return {
      amount: computed.quantity
        ? `${computed.quantity}${
          computed.quantity2 ? ` - ${computed.quantity2}` : ""
        }${
          parsed?.spaceBetweenQuantityAndUnit ? " " : ""
        }${parsed?.unitOfMeasure ?? ""}`
        : undefined,
      description: parsed?.description.trim(),
      amountType: parsed?.quantity
        ? (parsed?.unitOfMeasure ? "full" : "unitless")
        : "empty",
    };
  },
  parseMany: (
    ingredients: string[],
    recipeYield = 1,
    portions = 1,
  ): Ingredient[] => {
    const mapped = ingredients
      .map((i) => ingredient.parse(i, recipeYield, portions));
    const sortFn = SortOrder[sortOrder];
    if (sortFn) {
      return mapped.sort((i1, i2) => sortFn(i1) - sortFn(i2));
    }
    return mapped;
  },
};
