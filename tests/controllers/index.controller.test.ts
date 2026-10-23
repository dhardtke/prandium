import { afterEach, describe, expect, mock, spyOn, test } from "bun:test";
import { IndexController } from "../../src/controllers/index.controller.ts";
import { Database } from "../../src/data/db.ts";
import { Recipe } from "../../src/data/model/recipe.ts";
import { Tag } from "../../src/data/model/tag.ts";
import { Page } from "../../src/data/pagination.ts";
import { RecipeService } from "../../src/data/service/recipe.service.ts";
import { TagService } from "../../src/data/service/tag.service.ts";
import { RecipeListTemplate } from "../../src/tpl/templates/recipe/recipe-list.template.tsx";

describe("IndexController", () => {
    const db: Database = {} as Database;
    const tagService = new TagService(db);
    const recipeService = new RecipeService(db, tagService);

    function stubDatabaseMethods(totalRecipeCount: number, recipesReturnedByList: Recipe[], tagsInDatabase: Tag[]) {
        const recipeServiceCount = spyOn(recipeService, "count").mockReturnValueOnce(totalRecipeCount);
        const recipeServiceList = spyOn(recipeService, "list").mockReturnValueOnce(recipesReturnedByList);
        const tagServiceList = spyOn(tagService, "list").mockReturnValueOnce(tagsInDatabase);
        return { recipeServiceCount, recipeServiceList, tagServiceList };
    }

    afterEach(() => {
        mock.restore();
    });

    describe("list", () => {
        test("Given 55 recipes When loading with pageSize = 20 Then the pagination consists of 3 pages with correct parameters", () => {
            // Given
            const totalRecipeCount = 55;
            const recipesInDatabase: Recipe[] = Array.from(Array(totalRecipeCount).keys()).map((i) => new Recipe({ id: i }));
            const recipesReturnedByList = recipesInDatabase.slice(0, 20);
            const tagsInDatabase: Tag[] = [];
            const showTagFilter = true;

            const { recipeServiceCount, recipeServiceList, tagServiceList } = stubDatabaseMethods(totalRecipeCount, recipesReturnedByList, tagsInDatabase);
            const listTemplate = mock(RecipeListTemplate);
            const indexController = new IndexController(recipeService, tagService);
            indexController.listTemplate = listTemplate;

            // When
            const pageSize = 25;
            const output = indexController.list(
                {
                    tagIds: [],
                    title: "",
                },
                showTagFilter,
                undefined,
                {
                    page: 1,
                    pageSize,
                    currentUrl: "http://localhost:8080",
                },
            );

            // Then
            expect(recipeServiceCount).toHaveBeenCalledTimes(1);
            expect(recipeServiceList).toHaveBeenNthCalledWith(1, { limit: pageSize, offset: 0, filters: { tagIds: [], title: "" }, orderBy: undefined });
            expect(tagServiceList).toHaveBeenCalledTimes(1);
            expect(output).not.toEqual("");

            const templateCallProps = listTemplate.mock.calls[0][0];
            expect(templateCallProps.tags).toEqual([]);
            expect(templateCallProps.showTagFilter).toEqual(showTagFilter);

            const paginationCallArg = templateCallProps.recipes;
            const pages: Page[] = [{ number: 1, url: "http://localhost:8080/?page=1" }, { number: 2, url: "http://localhost:8080/?page=2" }, {
                number: 3,
                url: "http://localhost:8080/?page=3",
            }];

            expect(paginationCallArg.pageSize).toEqual(pageSize);
            expect(paginationCallArg.currentPage).toEqual(1);
            expect(paginationCallArg.totalItems).toEqual(totalRecipeCount);
            expect(paginationCallArg.totalPages).toEqual(3);
            expect(paginationCallArg.firstPage).toEqual(1);
            expect(paginationCallArg.lastPage).toEqual(3);
            expect(paginationCallArg.startIndex).toEqual(0);
            expect(paginationCallArg.endIndex).toEqual(24);
            expect(paginationCallArg.previousPage).toBeUndefined();
            expect(paginationCallArg.nextPage).toEqual(pages[1]);
            expect(paginationCallArg.pages).toEqual(pages);
            expect(paginationCallArg.items).toEqual(recipesReturnedByList);
        });

        test("Given 10 tags in the database Then they are passed to the template correctly", () => {
            // Given
            const tagsInDatabase: Tag[] = Array.from(Array(10).keys()).map((i) => new Tag({ id: i, title: `Tag ${i}` }));
            const showTagFilter = true;
            const tagIdsFilter = [1, 2, 3, 4];

            const { tagServiceList } = stubDatabaseMethods(0, [], tagsInDatabase);
            const listTemplate = mock(RecipeListTemplate);
            const indexController = new IndexController(recipeService, tagService);
            indexController.listTemplate = listTemplate;

            // When
            const pageSize = 25;
            indexController.list(
                {
                    tagIds: tagIdsFilter,
                    title: "",
                },
                showTagFilter,
                undefined,
                {
                    page: 1,
                    pageSize,
                    currentUrl: "http://localhost:8080",
                },
            );

            // Then
            expect(tagServiceList).toHaveBeenNthCalledWith(1, {
                orderBy: { column: "title" },
                loadRecipeCount: true,
                filters: {
                    tagsWithSameRecipes: {
                        ids: tagIdsFilter,
                        includeOthers: true,
                    },
                },
            });

            const templateCallProps = listTemplate.mock.calls[0][0];
            expect(templateCallProps.tags).toEqual(tagsInDatabase);
            expect(templateCallProps.showTagFilter).toEqual(showTagFilter);
        });
    });
});
