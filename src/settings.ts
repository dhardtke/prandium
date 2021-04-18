import { fs, log, path, Zod as z } from "../deps.ts";
import { getCpuCores } from "./util.ts";

export const DEFAULT_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:86.0) Gecko/20100101 Firefox/86.0";

/**
 * Specifies in which order ingredients are sorted on the recipe detail page.
 * "FULL" is used to denote ingredients where both a unit and a measurement is present (e.g. "100g")
 * "UNITLESS" is used to denote ingredients without a unit (e.g. "3")
 * "EMPTY" is used to denote ingredients with neither a unit nor a measurement (e.g. "Water")
 */
export enum IngredientSortOrder {
  /**
   * List them in the order they are stored.
   */
  ORIGINAL = "ORIGINAL",

  FULL_UNITLESS_EMPTY = "FULL_UNITLESS_EMPTY",
  UNITLESS_EMPTY_FULL = "UNITLESS_EMPTY_FULL",
  EMPTY_UNITLESS_FULL = "EMPTY_UNITLESS_FULL",
  UNITLESS_FULL_EMPTY = "UNITLESS_FULL_EMPTY",
  EMPTY_FULL_UNITLESS = "EMPTY_FULL_UNITLESS",
  FULL_EMPTY_UNITLESS = "FULL_EMPTY_UNITLESS",
}

export const DEFAULT_INGREDIENT_POSTPROCESSING = [
  "TL",
  "EL",
  "dl",
  "kl.",
  "gr.",
];

export interface Settings {
  /**
   * The number of workers to spawn concurrently when importing Recipes.
   * @default number of CPU cores on the system
   */
  importWorkerCount: number;

  /**
   * Configure in which order ingredients are sorted.
   * @see IngredientSortOrder#FULL_UNITLESS_EMPTY
   */
  ingredientSortOrder: IngredientSortOrder;

  /**
   * The ingredient extraction parser does not work one hundred percent for all locales.
   * Strings may be specified here which will be moved from an ingredient's description to its unit.
   * @see DEFAULT_INGREDIENT_POSTPROCESSING
   */
  ingredientUnitPostprocessing: string[];

  /**
   * The User Agent to use when doing HTTP Requests.
   * @see #DEFAULT_USER_AGENT
   */
  userAgent: string;

  /**
   * Whether a new history entry should be added when rating a Recipe for the first time.
   * @default true
   */
  addHistoryEntryWhenRating: boolean;
}

export const DEFAULT_SETTINGS: Partial<Settings> = {};
const CPU_CORES = getCpuCores();
const Schema = z.object({
  importWorkerCount: z.number().refine(
    (val?: number) =>
      CPU_CORES === undefined || val === undefined ||
      val > 0 && val <= CPU_CORES,
    (val?: number) => ({
      message:
        `importWorkerCount: Value ${val} must be greater 0 and lower than number of CPU cores available, i.e. ${getCpuCores()}.`,
    }),
  ).optional().default(CPU_CORES || 1),
  ingredientSortOrder: z.string().refine(
    (val: string) =>
      Boolean(IngredientSortOrder[val as unknown as IngredientSortOrder]),
    (val: string) => ({
      message: `ingredientSortOrder: Value ${val} must be one of ${
        Object.values(IngredientSortOrder)
      }`,
    }),
  ).optional().default(IngredientSortOrder.FULL_UNITLESS_EMPTY),
  ingredientUnitPostprocessing: z.array(z.string()).optional().default(
    DEFAULT_INGREDIENT_POSTPROCESSING,
  ),
  userAgent: z.string().optional().default(DEFAULT_USER_AGENT),
  addHistoryEntryWhenRating: z.boolean().optional().default(true),
});

export const SETTINGS_FILENAME = "settings.json";

export async function readFromDisk(configDir: string): Promise<Settings> {
  const file = path.join(configDir, SETTINGS_FILENAME);
  if (await fs.exists(file)) {
    const contents = await Deno.readTextFile(file);
    try {
      return Schema.parse(JSON.parse(contents)) as Settings;
    } catch (e) {
      throw new Error(`Error reading ${SETTINGS_FILENAME}: ${e}`);
    }
  }
  log.debug(() =>
    `Could not find settings file ${SETTINGS_FILENAME}. Using default settings: ${
      JSON.stringify(DEFAULT_SETTINGS)
    }`
  );
  return Schema.parse(DEFAULT_SETTINGS) as Settings;
}
