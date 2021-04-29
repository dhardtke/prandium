import { fs, log, path, Zod as z } from "../deps.ts";
import { getCpuCores } from "./util.ts";

export const DefaultUserAgent =
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
  Original = "Original",

  FullUnitlessEmpty = "FullUnitlessEmpty",
  UnitlessEmptyFull = "UnitlessEmptyFull",
  EmptyUnitlessFull = "EmptyUnitlessFull",
  UnitlessFullEmpty = "UnitlessFullEmpty",
  EmptyFullUnitless = "EmptyFullUnitless",
  FullEmptyUnitless = "FullEmptyUnitless",
}

export const DefaultIngredientPostprocessing = [
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
   * @see IngredientSortOrder#FullUnitlessEmpty
   */
  ingredientSortOrder: IngredientSortOrder;

  /**
   * The ingredient extraction parser does not work one hundred percent for all locales.
   * Strings may be specified here which will be moved from an ingredient's description to its unit.
   * @see DefaultIngredientPostprocessing
   */
  ingredientUnitPostprocessing: string[];

  /**
   * The User Agent to use when doing HTTP Requests.
   * @see #DefaultUserAgent
   */
  userAgent: string;

  /**
   * Whether a new history entry should be added when rating a Recipe for the first time.
   * @default true
   */
  addHistoryEntryWhenRating: boolean;

  /**
   * Whether the HTML should be minified.
   * @default false
   */
  minifyHtml: boolean;

  /**
   * Whether infinite scrolling should be enabled for the recipe list page.
   * @default false
   */
  infiniteScrolling: boolean;

  /**
   * The default number of recipes per page.
   * @default 24
   */
  pageSize: number;
}

const CpuCores = getCpuCores();
const Schema = z.object({
  importWorkerCount: z.number().refine(
    (val?: number) =>
      CpuCores === undefined || val === undefined ||
      val > 0 && val <= CpuCores,
    (val?: number) => ({
      message:
        `importWorkerCount: Value ${val} must be greater 0 and lower than number of CPU cores available, i.e. ${getCpuCores()}.`,
    }),
  ).optional().default(CpuCores || 1),
  ingredientSortOrder: z.string().refine(
    (val: string) =>
      Boolean(IngredientSortOrder[val as unknown as IngredientSortOrder]),
    (val: string) => ({
      message: `ingredientSortOrder: Value ${val} must be one of ${
        Object.values(IngredientSortOrder)
      }`,
    }),
  ).optional().default(IngredientSortOrder.FullUnitlessEmpty),
  ingredientUnitPostprocessing: z.array(z.string()).optional().default(
    DefaultIngredientPostprocessing,
  ),
  userAgent: z.string().optional().default(DefaultUserAgent),
  addHistoryEntryWhenRating: z.boolean().optional().default(true),
  minifyHtml: z.boolean().optional().default(false),
  infiniteScrolling: z.boolean().optional().default(false),
  pageSize: z.number().optional().default(24),
});

export const SettingsFilename = "settings.json";

export async function readFromDisk(configDir: string): Promise<Settings> {
  const file = path.join(configDir, SettingsFilename);
  if (await fs.exists(file)) {
    const contents = await Deno.readTextFile(file);
    try {
      return Schema.parse(JSON.parse(contents)) as Settings;
    } catch (e) {
      throw new Error(`Error reading ${SettingsFilename}: ${e}`);
    }
  }
  const defaultSettings = Schema.parse({}) as Settings;
  log.debug(() =>
    `Could not find settings file ${SettingsFilename}. Using default settings: ${
      JSON.stringify(defaultSettings)
    }`
  );
  return defaultSettings;
}
