import { Eta, log, path } from "../deps.ts";
import { Recipe } from "../data/model/recipe.ts";
import { Pagination } from "../data/pagination.ts";
import { Helpers } from "./helpers/helpers.ts";
import { root } from "../util.ts";

const TEMPLATE_DIR = root("src", "tpl", "templates");

Eta.configure({
  useWith: true,
  views: TEMPLATE_DIR,
});

interface TemplateData<Data = void> {
  data?: Data;
  h: typeof Helpers;
}

export class Template<Data = void> {
  private readonly filename: string;
  private source?: string;

  constructor(filename: string) {
    this.filename = filename;
  }

  public render(data?: Data): Promise<string> {
    return this.updateSource()
      .then((s) => Eta.render(s, this.buildArgs(data)) as string)
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

  private buildArgs(data?: Data): TemplateData {
    return {
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
export const RecipeListTemplate = new Template<{ recipes: Pagination<Recipe> }>(
  "recipe/recipe.list.eta.html",
);
export const RecipeImportTemplate = new Template(
  "recipe/recipe.import.eta.html",
);
export const RecipeDetailTemplate = new Template<
  { recipe: Recipe; portions?: number }
>(
  "recipe/recipe.detail.eta.html",
);
