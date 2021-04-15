import { fs, log, path, Zod as z } from "../deps.ts";
import { getCpuCores } from "./util.ts";

export interface Settings {
  /**
   * The number of workers to spawn concurrently when importing Recipes.
   * @default number of CPU cores on the system
   */
  importWorkerCount: number | null;

  // TODO doc & impl
  ingredientSortMode?: unknown;
}

export const DEFAULT_SETTINGS: Settings = {
  importWorkerCount: null,
};
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
  ),
  ingredientSortMode: z.number().optional(),
});

export const SETTINGS_FILENAME = "settings.json";

export async function readFromDisk(configDir: string): Promise<Settings> {
  const file = path.join(configDir, SETTINGS_FILENAME);
  if (await fs.exists(file)) {
    const contents = await Deno.readTextFile(file);
    try {
      return Schema.parse(JSON.parse(contents));
    } catch (e) {
      throw new Error(`Error reading ${SETTINGS_FILENAME}: ${e}`);
    }
  }
  log.debug(() =>
    `Could not find settings file ${SETTINGS_FILENAME}. Using default settings: ${
      JSON.stringify(DEFAULT_SETTINGS)
    }`
  );
  return DEFAULT_SETTINGS;
}
