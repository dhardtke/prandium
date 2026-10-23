// noinspection SqlResolve, SqlWithoutWhere

import { afterAll, afterEach, beforeAll, describe, expect, test } from "bun:test";
import { Database } from "../../../src/data/db.ts";
import { RecipeService } from "../../../src/data/service/recipe.service.ts";
import { TagService } from "../../../src/data/service/tag.service.ts";
import { disableLogging } from "../../_internal/disable-logging.ts";
import { flushAllTables } from "../../_internal/flush-all-tables.ts";

describe("RecipeService", () => {
    const db = new Database(":memory:");
    const tagService: TagService = {} as TagService;

    db.migrate();

    const recipeService = new RecipeService(db, tagService);

    beforeAll(() => {
        disableLogging();
    });

    afterEach(() => {
        flushAllTables(db);
    });

    afterAll(() => {
        db.close();
    });

    test("Given the recipes 'Recipe 1', 'Recipe 2', .., 'Recipe 4' When calling count Then 4 is returned", () => {
        db.exec("INSERT INTO recipe (title) VALUES ('Recipe 1'), ('Recipe 2'), ('Recipe 3'), ('Recipe 4')");
        expect(recipeService.count()).toEqual(4);
    });

    test("Given the recipes 'Foo', 'Bar', 'FooBar', 'Lorem' When filtering by the title 'Bar' Then 'Bar' and 'FooBar' are returned", () => {
        db.exec("INSERT INTO recipe (title) VALUES ('Foo'), ('Bar'), ('FooBar'), ('Lorem')");
        expect(recipeService.count({ title: "Bar" })).toEqual(2);
        expect(recipeService.list({ filters: { title: "Bar" } }).map((r) => r.title)).toEqual(["Bar", "FooBar"]);
    });

    describe("Given the recipes 'Foo' (tag1, tag2), 'Bar' (tag2, tag3)", () => {
        function insertRecipesAndTags() {
            db.exec("INSERT INTO recipe (title) VALUES ('Foo'), ('Bar')");
            db.exec("INSERT INTO tag (id) VALUES (1), (2), (3)");
            db.exec("INSERT INTO recipe_tag (tag_id, recipe_id) VALUES (1, (SELECT id FROM recipe WHERE title='Foo'))");
            db.exec("INSERT INTO recipe_tag (tag_id, recipe_id) VALUES (2, (SELECT id FROM recipe WHERE title='Foo'))");
            db.exec("INSERT INTO recipe_tag (tag_id, recipe_id) VALUES (2, (SELECT id FROM recipe WHERE title='Bar'))");
            db.exec("INSERT INTO recipe_tag (tag_id, recipe_id) VALUES (3, (SELECT id FROM recipe WHERE title='Bar'))");
        }

        test("When filtering by [tag1] Then only 'Foo' is returned", () => {
            insertRecipesAndTags();
            expect(recipeService.count({ tagIds: [1] })).toEqual(1);
            expect(recipeService.list({ filters: { tagIds: [1] } }).map((r) => r.title)).toEqual(["Foo"]);
        });

        test("When filtering by [tag2] Then ['Foo', 'Bar'] are returned", () => {
            insertRecipesAndTags();
            expect(recipeService.count({ tagIds: [2] })).toEqual(2);
            expect(recipeService.list({ filters: { tagIds: [2] } }).map((r) => r.title)).toEqual(["Foo", "Bar"]);
        });

        test("When filtering by [tag2, tag3] Then ['Bar'] is returned", () => {
            insertRecipesAndTags();
            expect(recipeService.count({ tagIds: [2, 3] })).toEqual(1);
            expect(recipeService.list({ filters: { tagIds: [2, 3] } }).map((r) => r.title)).toEqual(["Bar"]);
        });
    });

    test("Given a recipe that was cooked 4 times When loading the list of recipes Then cookedCount is 4", () => {
        db.exec("INSERT INTO recipe (id, title) VALUES (1, 'Foo')");
        db.exec(`INSERT INTO recipe_history (recipe_id, timestamp)
             VALUES (1, DATE('now', '-4 day')),
                    (1, DATE('now', '-3 day')),
                    (1, DATE('now', '-2 day')),
                    (1, DATE('now', '-1 day'))`);
        const recipes = recipeService.list();
        expect(recipes.length).toEqual(1);
        expect(recipes[0].cookedCount).toEqual(4);
    });

    test("Given a recipe that was cooked yesterday and today When loading the list of recipes Then lastCookedAt is today", () => {
        const { yesterday } = db.single<{ yesterday: string }>("SELECT DATE('now', '-1 day') AS yesterday")!;
        const yesterdayAsDate = new Date(yesterday);
        db.exec("INSERT INTO recipe (id, title) VALUES (1, 'Foo')");
        db.exec("INSERT INTO recipe_history (recipe_id, timestamp) VALUES (1, DATE('now', '-2 day')), (1, ?)", [yesterday]);
        const recipes = recipeService.list();
        expect(recipes.length).toEqual(1);
        expect(recipes[0].lastCookedAt).toEqual(yesterdayAsDate);
    });
});
