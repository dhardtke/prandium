// noinspection SqlResolve, SqlWithoutWhere

import { assertEquals } from "../../../deps.ts";
import { Database } from "../../../src/data/db.ts";
import { RecipeService } from "../../../src/data/service/recipe.service.ts";
import { TagService } from "../../../src/data/service/tag.service.ts";
import { disableLogging } from "../../_internal/disable_logging.ts";
import { flushAllTables } from "../../_internal/flush_all_tables.ts";

Deno.test("RecipeService", async (t) => {
  await disableLogging();

  const db = new Database(":memory:");
  const tagService: TagService = {} as TagService;

  db.migrate();

  const recipeService = new RecipeService(db, tagService);

  await t.step("Given the recipes 'Recipe 1', 'Recipe 2', .., 'Recipe 4' When calling count Then 4 is returned", () => {
    db.exec("INSERT INTO recipe (title) VALUES ('Recipe 1'), ('Recipe 2'), ('Recipe 3'), ('Recipe 4')");
    assertEquals(recipeService.count(), 4);
  });
  flushAllTables(db);

  await t.step("Given the recipes 'Foo', 'Bar', 'FooBar', 'Lorem' When filtering by the title 'Bar' Then 'Bar' and 'FooBar' are returned", () => {
    db.exec("INSERT INTO recipe (title) VALUES ('Foo'), ('Bar'), ('FooBar'), ('Lorem')");
    assertEquals(recipeService.count({ title: "Bar" }), 2);
    assertEquals(recipeService.list({ filters: { title: "Bar" } }).map((r) => r.title), ["Bar", "FooBar"]);
  });
  flushAllTables(db);

  await t.step("Given the recipes 'Foo' (tag1, tag2), 'Bar' (tag2, tag3)", async (t) => {
    db.exec("INSERT INTO recipe (title) VALUES ('Foo'), ('Bar')");
    db.exec("INSERT INTO tag (id) VALUES (1), (2), (3)");
    db.exec("INSERT INTO recipe_tag (tag_id, recipe_id) VALUES (1, (SELECT id FROM recipe WHERE title='Foo'))");
    db.exec("INSERT INTO recipe_tag (tag_id, recipe_id) VALUES (2, (SELECT id FROM recipe WHERE title='Foo'))");
    db.exec("INSERT INTO recipe_tag (tag_id, recipe_id) VALUES (2, (SELECT id FROM recipe WHERE title='Bar'))");
    db.exec("INSERT INTO recipe_tag (tag_id, recipe_id) VALUES (3, (SELECT id FROM recipe WHERE title='Bar'))");

    await t.step("When filtering by [tag1] Then only 'Foo' are returned", () => {
      assertEquals(recipeService.count({ tagIds: [1] }), 1);
      assertEquals(recipeService.list({ filters: { tagIds: [1] } }).map((r) => r.title), ["Foo"]);
    });

    await t.step("When filtering by [tag2] Then ['Foo', 'Bar'] are returned", () => {
      assertEquals(recipeService.count({ tagIds: [2] }), 2);
      assertEquals(recipeService.list({ filters: { tagIds: [2] } }).map((r) => r.title), ["Foo", "Bar"]);
    });

    await t.step("When filtering by [tag2, tag3] Then ['Bar'] is returned", () => {
      assertEquals(recipeService.count({ tagIds: [2, 3] }), 1);
      assertEquals(recipeService.list({ filters: { tagIds: [2, 3] } }).map((r) => r.title), ["Bar"]);
    });
  });
  flushAllTables(db);

  await t.step("Given a recipe that was cooked 4 times When loading the list of recipes Then cookedCount is 4", () => {
    db.exec("INSERT INTO recipe (id, title) VALUES (1, 'Foo')");
    db.exec(`INSERT INTO recipe_history (recipe_id, timestamp)
             VALUES (1, DATE('now', '-4 day')),
                    (1, DATE('now', '-3 day')),
                    (1, DATE('now', '-2 day')),
                    (1, DATE('now', '-1 day'))`);
    const recipes = recipeService.list();
    assertEquals(recipes.length, 1);
    assertEquals(recipes[0].cookedCount, 4);
  });
  flushAllTables(db);

  await t.step("Given a recipe that was cooked yesterday and today When loading the list of recipes Then lastCookedAt is today", () => {
    const { yesterday } = db.single<{ yesterday: string }>("SELECT DATE('now', '-1 day') AS yesterday")!;
    const yesterdayAsDate = new Date(yesterday);
    db.exec("INSERT INTO recipe (id, title) VALUES (1, 'Foo')");
    db.exec("INSERT INTO recipe_history (recipe_id, timestamp) VALUES (1, DATE('now', '-2 day')), (1, ?)", [yesterday]);
    const recipes = recipeService.list();
    assertEquals(recipes.length, 1);
    assertEquals(recipes[0].lastCookedAt, yesterdayAsDate);
  });
  flushAllTables(db);

  db.close();
});
