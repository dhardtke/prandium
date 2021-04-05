import { Recipe } from "../data/model/recipe.ts";
import { Tag } from "../data/model/tag.ts";
import { Pagination } from "../data/pagination.ts";
import { ImportResult } from "../data/parse/import_recipe.ts";
import { Eta, log, path } from "../../deps.ts";
import { AppState } from "../http/webserver.ts";
import { root } from "../util.ts";
import { Helpers } from "./helpers/helpers.ts";

const TEMPLATE_DIR = root("src", "tpl", "templates");

Eta.configure({
  useWith: true,
  views: TEMPLATE_DIR,
});

interface TemplateData<Data = void> {
  data?: Data;
  appState: AppState;
  currentUrl: URL;
  h: typeof Helpers;
}

export class Template<Data = void> {
  private readonly filename: string;
  private source?: string;

  constructor(filename: string) {
    this.filename = filename;
  }

  public render(
    appState: AppState,
    currentUrl: URL,
    data?: Data,
  ): Promise<string> {
    return this.updateSource()
      .then((s) =>
        Eta.render(s, this.buildArgs(appState, currentUrl, data)) as string
      )
      .catch((e) => {
        log.error(`Could not render ${this.filename}`);
        throw e;
      });
  }

  private async updateSource(): Promise<string> {
    if (this.source == null) {
      try {
        const fullPath = path.resolve(TEMPLATE_DIR, this.filename);
        this.source = await Deno.readTextFile(fullPath);
      } catch (e) {
        log.error(`Could not load ${this.filename}`);
        throw e;
      }
    }
    return this.source;
  }

  private buildArgs(
    appState: AppState,
    currentUrl: URL,
    data?: Data,
  ): TemplateData {
    return {
      appState,
      currentUrl,
      ...data || {},
      ...{
        h: Helpers,
      },
    };
  }
}

export const NotFoundTemplate = new Template(
  "error/404.eta.html",
);

export const ServerErrorTemplate = new Template(
  "error/500.eta.html",
);

export const IndexTemplate = new Template(
  "index.eta.html",
);
export const RecipeListTemplate = new Template<{
  recipes: Pagination<Recipe>;
  tags: Tag[];
}>(
  "recipe/recipe.list.eta.html",
);
export const RecipeImportTemplate = new Template<{ results: ImportResult[] }>(
  "recipe/recipe.import.eta.html",
);
export const RecipeDetailTemplate = new Template<
  { recipe: Recipe; portions?: number }
>(
  "recipe/recipe.detail.eta.html",
);
export const RecipeEditTemplate = new Template<
  { recipe: Recipe }
>(
  "recipe/recipe.edit.eta.html",
);
export const RecipeDeleteTemplate = new Template<
  { recipe: Recipe }
>(
  "recipe/recipe.delete.eta.html",
);
