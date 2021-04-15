import { Recipe } from "../../model/recipe.ts";
import { ImportRecipeRequest, ImportRecipeResponse } from "./types.ts";

export interface ImportResult {
  url: string;
  success: boolean;
  error?: string;
  recipe?: Recipe;
}

export function importRecipes(
  args: {
    urls: string[];
    configDir: string;
    importWorkerCount: number | null;
  },
): Promise<ImportResult[]> {
  const results: ImportResult[] = [];
  let running = 0;

  return new Promise((resolve) => {
    const workerDone = (e: MessageEvent<ImportRecipeResponse>) => {
      running--;
      results.push(e.data);
      if (running === 0) {
        resolve(results);
      }
    };

    // TODO control how many workers are spawned
    for (const url of args.urls) {
      const worker = new Worker(
        new URL("./import_worker.ts", import.meta.url).href,
        {
          type: "module",
          // @ts-ignore IntelliJ hiccup
          deno: {
            namespace: true,
          },
        },
      );
      worker.onmessage = workerDone;
      const request: ImportRecipeRequest = {
        url: url.trim(),
        configDir: args.configDir,
      };
      worker.postMessage(request);
      running++;
    }
  });
}
