import { afterAll, describe, expect, test } from "bun:test";
import { RecipeController } from "../../src/controllers/recipe.controller.ts";
import { Database } from "../../src/data/db.ts";
import { Recipe } from "../../src/data/model/recipe.ts";
import { RecipeService } from "../../src/data/service/recipe.service.ts";
import { TagService } from "../../src/data/service/tag.service.ts";
import { Settings } from "../../src/data/settings.ts";
import { NotFoundError } from "../../src/shared/errors.ts";
import { sleep } from "../_internal/sleep.ts";

describe("RecipeController", () => {
    const db: Database = new Database(":memory:");
    db.migrate();
    const tagService = new TagService(db);
    const recipeService = new RecipeService(db, tagService);
    const settings = {} as Settings;
    const configDir = "";
    const recipeController = new RecipeController(recipeService, settings, configDir);

    afterAll(() => {
        db.close();
    });

    describe("flag", () => {
        test.each([false, true])(
            `Given a recipe with flagged=%p When calling flag Then both the one in the database and the returned one have flagged toggled`,
            async (flag) => {
                // Given
                const inputRecipe = new Recipe({ flagged: flag });
                recipeService.create([inputRecipe]);
                const inputRecipeUpdatedAt = inputRecipe.updatedAt;

                // When
                await sleep(1); // sleep 1ms to see a difference in recipe.updatedAt
                const recipeReturnedByMethod = recipeController.flag(inputRecipe.id!);

                // Then
                const recipeInDatabase = recipeService.find(inputRecipe.id!);
                for (const recipe of [recipeReturnedByMethod, recipeInDatabase]) {
                    expect(recipe!.flagged).toEqual(!flag);
                    expect(recipe!.updatedAt.getTime()).not.toEqual(inputRecipeUpdatedAt.getTime());
                }
            },
        );

        test(`Given an ID of a recipe that does not exist When calling flag Then an exception is thrown`, () => {
            // Given
            const recipeId = 42;

            // When & Then
            expect(() => recipeController.flag(recipeId)).toThrow(NotFoundError);
            expect(() => recipeController.flag(recipeId)).toThrow(`Recipe not found: ${recipeId}`);
        });
    });
});
