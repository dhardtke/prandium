import { log, path } from "../../../../deps.ts";
import { IS_COMPILED, root } from "../../../shared/util.ts";
import { Recipe } from "../../model/recipe.ts";
import { ImportRecipeRequest, ImportRecipeResponse } from "./types.ts";

const WORKER_URL = IS_COMPILED
  ? new URL("./import-worker.min.js", Deno.mainModule)
  : path.toFileUrl(root("src", "data", "parse", "import", "import-worker.ts"));

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
    importWorkerCount: number;
    userAgent: string;
  },
): Promise<ImportResult[]> {
  const results: ImportResult[] = [];
  let pending = 0;

  return new Promise((resolve) => {
    if (args.urls.length === 0) {
      resolve(results);
    }

    const workers: Worker[] = [];
    const jobs: string[] = [...args.urls];
    const workerCount = Math.min(
      args.urls.length,
      args.importWorkerCount,
    );

    const workerDone = (
      e: MessageEvent<ImportRecipeResponse>,
      worker: Worker,
    ) => {
      pending--;
      log.debug(() => `Received import result: ${JSON.stringify(e.data)}`);
      results.push(e.data);
      if (!maybePostJob(worker)) {
        workers.splice(workers.indexOf(worker), 1);
        worker.terminate();
      }
      if (pending === 0) {
        workers.forEach((worker) => worker.terminate());
        resolve(results);
      }
    };

    const maybePostJob = (worker: Worker): boolean => {
      if (jobs.length === 0) {
        return false;
      }
      const url = jobs.splice(0, 1)[0];
      const request: ImportRecipeRequest = {
        url: url.trim(),
        configDir: args.configDir,
        userAgent: args.userAgent,
      };
      worker.postMessage(request);
      pending++;
      return true;
    };

    for (let i = 0; i < workerCount; i++) {
      const worker = new Worker(
        WORKER_URL.href,
        {
          type: "module",
          deno: {
            namespace: true,
          },
        },
      );
      worker.onmessage = (e: MessageEvent<ImportRecipeResponse>) => workerDone(e, worker);
      workers.push(worker);
      maybePostJob(worker);
    }
  });
}
