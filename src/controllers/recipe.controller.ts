import * as needle from "@needle-di/core";
import { rm } from "node:fs/promises";
import path from "node:path";
import { Recipe } from "../data/model/recipe.ts";
import { importRecipes } from "../data/parse/import/import-recipe.ts";
import { RecipeService } from "../data/service/recipe.service.ts";
import { type Settings } from "../data/settings.ts";
import { getThumbnailDir, getUniqueFilename } from "../data/util/thumbnails.ts";
import { CONFIG_DIR, SETTINGS } from "../di.ts";
import { NotFoundError } from "../shared/errors.ts";
import { RecipeDeleteTemplate } from "../tpl/templates/recipe/recipe-delete.template.tsx";
import { RecipeDetailTemplate } from "../tpl/templates/recipe/recipe-detail.template.tsx";
import { RecipeEditTemplate } from "../tpl/templates/recipe/recipe-edit.template.tsx";
import { RecipeImportTemplate } from "../tpl/templates/recipe/recipe-import.template.tsx";
import { renderTemplate } from "../tpl/util/render.ts";

async function deleteThumbnail(recipe: Recipe, configDir: string) {
    if (recipe.thumbnail) {
        const thumbnailDir = getThumbnailDir(configDir);
        try {
            await rm(path.join(thumbnailDir, recipe.thumbnail));
        } catch {
            // ignore
        }
    }
}

async function handleThumbnail(recipe: Recipe, configDir: string, thumbnail: File | undefined, shouldDeleteThumbnail: boolean) {
    if (shouldDeleteThumbnail) {
        await deleteThumbnail(recipe, configDir);
        recipe.thumbnail = undefined;
    }
    if (thumbnail?.name) {
        // TODO server-side type validation?
        const thumbnailDir = getThumbnailDir(configDir);
        const filename = getUniqueFilename(thumbnailDir, thumbnail.name);
        await Bun.write(path.join(thumbnailDir, filename), thumbnail);
        await deleteThumbnail(recipe, configDir);
        recipe.thumbnail = filename;
    }
}

@needle.injectable()
export class RecipeController {
    constructor(
        private recipeService: RecipeService = needle.inject(RecipeService),
        private settings: Settings = needle.inject(SETTINGS),
        private configDir: string = needle.inject(CONFIG_DIR),
    ) {}

    createGet() {
        return renderTemplate(RecipeEditTemplate());
    }

    async postCreate(recipe: Recipe, thumbnail: File | undefined, shouldDeleteThumbnail: boolean) {
        await handleThumbnail(recipe, this.configDir, thumbnail, shouldDeleteThumbnail);
        this.recipeService.create([recipe]);
        return recipe;
    }

    getImport() {
        return renderTemplate(RecipeImportTemplate());
    }

    async postImport(urls?: string[]) {
        if (!urls) {
            return;
        }
        const results = await importRecipes({
            urls,
            configDir: this.configDir,
            importConcurrency: this.settings.importConcurrency,
            userAgent: this.settings.userAgent,
        });
        this.recipeService.create(results.filter((r) => r.success).map((r) => r.recipe!));
        return renderTemplate(RecipeImportTemplate({ results }));
    }

    getEdit(id: number) {
        const recipe = this.recipeService.find(id, true, true, true);
        if (!recipe) {
            throw new NotFoundError(`Recipe not found: ${id}`);
        }

        return renderTemplate(RecipeEditTemplate({ recipe }));
    }

    async postEdit(id: number, inputRecipe: Recipe, thumbnail: File | undefined, shouldDeleteThumbnail: boolean) {
        const dbRecipe = this.recipeService.find(id, true, true, true);
        if (!dbRecipe) {
            throw new NotFoundError(`Recipe not found: ${id}`);
        } else {
            inputRecipe.id = dbRecipe.id;
            inputRecipe.thumbnail ??= dbRecipe.thumbnail;
            await handleThumbnail(inputRecipe, this.configDir, thumbnail, shouldDeleteThumbnail);
            this.recipeService.update([inputRecipe], true);
            return inputRecipe;
        }
    }

    rate(id: number, rating: number) {
        // TODO use update route and ensure only non-empty fields are set?
        const recipe = this.recipeService.find(id, false, true);
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
        const recipe = this.recipeService.find(id);
        if (!recipe) {
            throw new NotFoundError(`Recipe not found: ${id}`);
        } else {
            return renderTemplate(RecipeDeleteTemplate({ recipe }));
        }
    }

    async postDelete(id: number) {
        const recipe = this.recipeService.find(id);
        if (!recipe) {
            throw new NotFoundError(`Recipe not found: ${id}`);
        } else {
            await deleteThumbnail(recipe, this.configDir);
            this.recipeService.delete([recipe]);
        }
    }

    flag(id: number) {
        const recipe = this.recipeService.find(id);
        if (!recipe) {
            throw new NotFoundError(`Recipe not found: ${id}`);
        } else {
            recipe.flagged = !recipe.flagged;
            recipe.updatedAt = new Date();
            this.recipeService.update([recipe]);
            return recipe;
        }
    }

    get(id: number, portions?: number) {
        const recipe = this.recipeService.find(id, true, true, true);
        if (!recipe) {
            throw new NotFoundError(`Recipe not found: ${id}`);
        } else {
            return renderTemplate(
                RecipeDetailTemplate({
                    recipe,
                    portions: portions ?? recipe.yield,
                }),
            );
        }
    }
}
