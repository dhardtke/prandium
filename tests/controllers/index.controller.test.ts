import { assertEquals, assertNotEquals, assertSpyCall, assertSpyCallArg, restore, returnsNext, spy, stub } from "../../deps-test.ts";
import { IndexController } from "../../src/controllers/index.controller.ts";
import { Database } from "../../src/data/db.ts";
import { Recipe } from "../../src/data/model/recipe.ts";
import { Tag } from "../../src/data/model/tag.ts";
import { Page } from "../../src/data/pagination.ts";
import { RecipeService } from "../../src/data/service/recipe.service.ts";
import { TagService } from "../../src/data/service/tag.service.ts";
import { RecipeListTemplate } from "../../src/tpl/templates/recipe/recipe-list.template.tsx";

Deno.test("IndexController", async (t) => {
  const db: Database = {} as Database;
  const tagService = new TagService(db);
  const recipeService = new RecipeService(db, tagService);

  function stubDatabaseMethods(totalRecipeCount: number, recipesReturnedByList: Recipe[], tagsInDatabase: Tag[]) {
    const recipeServiceCount = stub(recipeService, "count", returnsNext([
      totalRecipeCount
    ]));
    const recipeServiceList = stub(recipeService, "list", returnsNext([
      recipesReturnedByList
    ]));
    const tagServiceList = stub(tagService, "list", returnsNext([
      tagsInDatabase
    ]));
    return { recipeServiceCount, recipeServiceList, tagServiceList };
  }

  await t.step("list", async (t) => {
    await t.step("Given 55 recipes When loading with pageSize = 20 Then the pagination consists of 3 pages with correct parameters", () => {
      // Given
      const totalRecipeCount = 55;
      const recipesInDatabase: Recipe[] = Array.from(Array(totalRecipeCount).keys()).map(i => new Recipe({ id: i }));
      const recipesReturnedByList = recipesInDatabase.slice(0, 20);
      const tagsInDatabase: Tag[] = [];
      const showTagFilter = true;

      const { recipeServiceCount, recipeServiceList, tagServiceList } = stubDatabaseMethods(totalRecipeCount, recipesReturnedByList, tagsInDatabase);
      const listTemplate = spy(RecipeListTemplate);
      const indexController = new IndexController(recipeService, tagService);
      indexController.listTemplate = listTemplate;

      // When
      const pageSize = 25;
      const output = indexController.list({
        tagIds: [],
        title: ""
      }, showTagFilter, undefined, {
        page: 1,
        pageSize,
        currentUrl: "http://localhost:8080"
      });

      // Then
      assertSpyCall(recipeServiceCount, 0);
      assertSpyCall(recipeServiceList, 0, {
        args: [{ limit: pageSize, offset: 0, filters: { tagIds: [], title: "" }, orderBy: undefined }]
      });
      assertSpyCall(tagServiceList, 0);
      assertNotEquals(output, "");

      const templateCallProps = listTemplate.calls[0].args[0];
      assertEquals(templateCallProps.tags, []);
      assertEquals(templateCallProps.showTagFilter, showTagFilter);

      const paginationCallArg = templateCallProps.recipes;
      const pages: Page[] = [{number: 1, url: "http://localhost:8080/?page=1"}, {number: 2, url: "http://localhost:8080/?page=2"}, {number: 3, url: "http://localhost:8080/?page=3"}];

      assertEquals(paginationCallArg.pageSize, pageSize);
      assertEquals(paginationCallArg.currentPage, 1);
      assertEquals(paginationCallArg.totalItems, totalRecipeCount);
      assertEquals(paginationCallArg.totalPages, 3);
      assertEquals(paginationCallArg.firstPage, 1);
      assertEquals(paginationCallArg.lastPage, 3);
      assertEquals(paginationCallArg.startIndex, 0);
      assertEquals(paginationCallArg.endIndex, 24);
      assertEquals(paginationCallArg.previousPage, undefined);
      assertEquals(paginationCallArg.nextPage, pages[1]);
      assertEquals(paginationCallArg.pages, pages);
      assertEquals(paginationCallArg.items, recipesReturnedByList);
    });
    restore();

    await t.step("Given 10 tags in the database Then they are passed to the template correctly", () => {
      // Given
      const tagsInDatabase: Tag[] = Array.from(Array(10).keys()).map(i => new Tag({id: i, title: `Tag ${i}`}));
      const showTagFilter = true;
      const tagIdsFilter = [1, 2, 3, 4];

      const { tagServiceList } = stubDatabaseMethods(0, [], tagsInDatabase);
      const listTemplate = spy(RecipeListTemplate);
      const indexController = new IndexController(recipeService, tagService);
      indexController.listTemplate = listTemplate;

      // When
      const pageSize = 25;
      indexController.list({
        tagIds: tagIdsFilter,
        title: ""
      }, showTagFilter, undefined, {
        page: 1,
        pageSize,
        currentUrl: "http://localhost:8080"
      });

      // Then
      assertSpyCallArg(tagServiceList, 0, 0, {
        orderBy: { column: "title" },
        loadRecipeCount: true,
        filters: {
          tagsWithSameRecipes: {
            ids: tagIdsFilter,
            includeOthers: true,
          },
        },
      });

      const templateCallProps = listTemplate.calls[0].args[0];
      assertEquals(templateCallProps.tags,  tagsInDatabase);
      assertEquals(templateCallProps.showTagFilter, showTagFilter);
    });
    restore();
  });
});
