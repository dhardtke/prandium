import { inject, path, singleton } from "../../deps.ts";
import { Recipe } from "../data/model/recipe.ts";
import { importRecipes } from "../data/parse/import/import_recipe.ts";
import { RecipeService } from "../data/service/recipe.service.ts";
import { type Settings } from "../data/settings.ts";
import { getThumbnailDir, getUniqueFilename } from "../data/util/thumbnails.ts";
import { CONFIG_DIR, SETTINGS } from "../di.ts";
import { NotFoundError } from "../http/middleware/error.ts";
import { RecipeDeleteTemplate } from "../tpl/templates/recipe/recipe-delete.template.ts";
import { RecipeDetailTemplate } from "../tpl/templates/recipe/recipe-detail.template.ts";
import { RecipeEditTemplate } from "../tpl/templates/recipe/recipe-edit.template.ts";
import { RecipeImportTemplate } from "../tpl/templates/recipe/recipe-import.template.ts";

export interface SentFile {
  filename?: string;
  originalName: string;
}

async function deleteThumbnail(recipe: Recipe, configDir: string) {
  if (recipe.thumbnail) {
    const thumbnailDir = getThumbnailDir(configDir);
    try {
      await Deno.remove(path.join(thumbnailDir, recipe.thumbnail));
    } catch {
      // ignore
    }
  }
}

async function handleThumbnail(recipe: Recipe, configDir: string, thumbnail: SentFile, shouldDeleteThumbnail: boolean) {
  if (shouldDeleteThumbnail) {
    await deleteThumbnail(recipe, configDir);
    recipe.thumbnail = undefined;
  }
  if (thumbnail?.filename) {
    // TODO server-side type validation?
    const thumbnailDir = getThumbnailDir(configDir);
    const filename = getUniqueFilename(
      thumbnailDir,
      thumbnail.originalName,
    );
    await Deno.copyFile(
      thumbnail.filename,
      path.join(thumbnailDir, filename),
    );
    await Deno.remove(thumbnail.filename);
    await deleteThumbnail(recipe, configDir);
    recipe.thumbnail = filename;
  }
}

@singleton()
export class RecipeController {
  constructor(private recipeService: RecipeService, @inject(SETTINGS) private settings: Settings, @inject(CONFIG_DIR) private configDir: string) {
  }

  createGet() {
    return RecipeEditTemplate();
  }

  async postCreate(data: Record<keyof Recipe, string[]>, thumbnail: SentFile, shouldDeleteThumbnail: boolean) {
    const recipe = new Recipe({}).updateFromRawData(data);
    await handleThumbnail(recipe, this.configDir, thumbnail, shouldDeleteThumbnail);
    this.recipeService.create([recipe]);
    return recipe;
  }

  getImport() {
    return RecipeImportTemplate();
  }

  async postImport(urls?: string[]) {
    if (!urls) {
      return;
    }
    const results = await importRecipes({
      urls,
      configDir: this.configDir,
      importWorkerCount: this.settings.importWorkerCount,
      userAgent: this.settings.userAgent,
    });
    this.recipeService.create(results.filter((r) => r.success).map((r) => r.recipe!));
    return RecipeImportTemplate(results);
  }

  getEdit(id: number) {
    const recipe = this.recipeService.find(
      id,
      true,
      true,
      true,
    );
    if (!recipe) {
      throw new NotFoundError(`Recipe not found: ${id}`);
    }

    return RecipeEditTemplate(recipe);
  }

  async postEdit(id: number, data: Record<keyof Recipe, string[]>, thumbnail: SentFile, shouldDeleteThumbnail: boolean) {
    const recipe = this.recipeService.find(
      id,
      true,
      true,
      true,
    );
    if (!recipe) {
      throw new NotFoundError(`Recipe not found: ${id}`);
    } else {
      recipe.updateFromRawData(data);
      await handleThumbnail(recipe, this.configDir, thumbnail, shouldDeleteThumbnail);
      this.recipeService.update([recipe], true);
      return recipe;
    }
  }

  rate(id: number, rating: number) {
    // TODO use update route and ensure only non-empty fields are set?
    const recipe = this.recipeService.find(
      id,
      false,
      true,
    );
    if (!recipe) {
      throw new NotFoundError(`Recipe not found: ${id}`);
    } else {
      if (this.settings.addHistoryEntryWhenRating && !recipe.rating) {
        recipe.history.push(new Date());
      }
      recipe.rating = rating;
      this.recipeService.update([recipe], true);
      return "Ok";
    }
  }

  getDelete(id: number) {
    const recipe = this.recipeService.find(
      id,
    );
    if (!recipe) {
      throw new NotFoundError(`Recipe not found: ${id}`);
    } else {
      return RecipeDeleteTemplate(recipe);
    }
  }

  async postDelete(id: number) {
    const recipe = this.recipeService.find(
      id,
    );
    if (!recipe) {
      throw new NotFoundError(`Recipe not found: ${id}`);
    } else {
      await deleteThumbnail(recipe, this.configDir);
      this.recipeService.delete([recipe]);
    }
  }

  flag(id: number) {
    const recipe = this.recipeService.find(
      id,
    );
    if (!recipe) {
      throw new NotFoundError(`Recipe not found: ${id}`);
    } else {
      recipe.flagged = !recipe.flagged;
      this.recipeService.update([recipe]);
      return recipe;
    }
  }

  get(id: number, portions?: number) {
    const recipe = this.recipeService.find(
      id,
      true,
      true,
      true,
    );
    if (!recipe) {
      throw new NotFoundError(`Recipe not found: ${id}`);
    } else {
      return RecipeDetailTemplate(
        recipe,
        portions ?? recipe.yield,
      );
    }
  }
}
