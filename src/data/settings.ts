import { fs, log, path } from "../../deps.ts";
import { getCpuCores } from "../shared/util.ts";

export const DefaultUserAgent =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:86.0) Gecko/20100101 Firefox/86.0";

export interface Settings {
  /**
   * The number of workers to spawn concurrently when importing Recipes.
   * @default number of CPU cores on the system
   */
  importWorkerCount: number;

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

export const SettingsFilename = "settings.json";

const CpuCores = getCpuCores();
const DefaultSettings: Settings = {
  importWorkerCount: CpuCores,
  userAgent: DefaultUserAgent,
  addHistoryEntryWhenRating: true,
  minifyHtml: false,
  infiniteScrolling: false,
  pageSize: 24,
};

// deno-lint-ignore no-explicit-any
function validate(settings: any): Settings {
  const validate: Record<keyof Settings, unknown> = Object.assign(
    DefaultSettings,
    settings,
  );
  if (
    typeof validate.importWorkerCount !== "number" ||
    validate.importWorkerCount <= 0 || validate.importWorkerCount > CpuCores
  ) {
    throw new Error(`importWorkerCount must be between 1 and ${CpuCores}`);
  }
  const types: Record<keyof Settings, "boolean" | "string" | "number"> = {
    importWorkerCount: "number",
    userAgent: "string",
    addHistoryEntryWhenRating: "boolean",
    minifyHtml: "boolean",
    infiniteScrolling: "boolean",
    pageSize: "number",
  };
  for (const [property, type] of Object.entries(types)) {
    // deno-lint-ignore valid-typeof
    if (typeof validate[property as keyof Settings] !== type) {
      throw new Error(`${property} must be of type ${type}`);
    }
  }
  for (const option of Object.keys(validate)) {
    if (!(option in types)) {
      throw new Error(`Unknown property ${option}`);
    }
  }
  return validate as Settings;
}

export async function readFromDisk(configDir: string): Promise<Settings> {
  const file = path.join(configDir, SettingsFilename);
  if (await fs.exists(file)) {
    const contents = await Deno.readTextFile(file);
    try {
      return validate(JSON.parse(contents));
    } catch (e) {
      throw new Error(`Error reading ${SettingsFilename}: ${e}`);
    }
  }
  log.debug(() =>
    `Could not find settings file ${SettingsFilename}. Using default settings: ${
      JSON.stringify(DefaultSettings)
    }`
  );
  return DefaultSettings;
}
