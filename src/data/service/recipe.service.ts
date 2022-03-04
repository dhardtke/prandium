import { Database } from "../db.ts";
import { Recipe, Review } from "../model/recipe.ts";
import { pushAll, toCamelCase, toDate } from "../util/convert.ts";
import { buildFilters, buildOrderBySql, columns, Filter, placeholders } from "../util/sql.ts";
import { OrderBy, Service } from "./service.ts";
import { TagService } from "./tag.service.ts";

function tagFilter(tagIds?: number[]): Filter {
  return {
    active: Boolean(tagIds?.length),
    sql: () => tagIds!.map(() => `EXISTS (SELECT TRUE FROM recipe_tag WHERE tag_id = ? AND recipe_id = recipe.id)`).join(" AND "),
    bindings: () => tagIds!,
  };
}

function titleFilter(title?: string): Filter {
  return {
    active: Boolean(title),
    sql: () => `recipe.title LIKE ?`,
    bindings: () => [`%${title}%`],
  };
}

export class RecipeService implements Service<Recipe> {
  private readonly db: Database;
  private readonly tagService: TagService;

  constructor(db: Database, tagService: TagService) {
    this.db = db;
    this.tagService = tagService;
  }

  count(filters?: {
    tagIds?: number[];
    title?: string;
  }): number {
    const filter = buildFilters(
      tagFilter(filters?.tagIds),
      titleFilter(filters?.title),
    );
    return this.db.single<{ total: number }>(
      `SELECT COUNT(*) AS total
       FROM recipe
       WHERE ${filter.sql}`,
      [
        ...filter.bindings,
      ],
    )!.total;
  }

  list(
    args: {
      limit?: number;
      offset?: number;
      orderBy?: OrderBy;
      filters?: {
        tagIds?: number[];
        title?: string;
      };
    },
  ): Recipe[] {
    const filter = buildFilters(
      tagFilter(args.filters?.tagIds),
      titleFilter(args.filters?.title),
    );
    const orderByColumns = [
      ...Recipe.columns,
      "last_cooked_at",
      "cooked_count",
      "total_time",
    ];
    const totalTime = "(prep_time + cook_time) AS total_time";
    const lastCookedAt = "(SELECT MAX(timestamp) FROM recipe_history WHERE recipe_id = recipe.id) AS last_cooked_at";
    const cookedCount = "(SELECT COUNT(*) FROM recipe_history WHERE recipe_id = recipe.id) AS cooked_count";
    return this.db.query(
      `SELECT ${columns([...Recipe.columns, totalTime, lastCookedAt, cookedCount])}
       FROM recipe
       WHERE ${filter.sql} ${buildOrderBySql(args.orderBy, orderByColumns)}
       LIMIT ? OFFSET ?`,
      [
        ...filter.bindings,
        args.limit || -1,
        args.offset || 0,
      ],
    ).map((src) => new Recipe(toCamelCase(src)));
  }

  create(recipes: Recipe[]): void {
    this.db.transaction(() => {
      this.db.prepare<{ id: number }>(
        `INSERT INTO recipe (created_at, updated_at, title, description, source, thumbnail, yield, nutrition_calories, nutrition_carbohydrate,
                             nutrition_cholesterol, nutrition_fat, nutrition_fiber, nutrition_protein, nutrition_saturated_fat, nutrition_sodium,
                             nutrition_sugar, nutrition_trans_fat, nutrition_unsaturated_fat, prep_time, cook_time, aggregate_rating_value,
                             aggregate_rating_count, rating, ingredients, instructions)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, json(?), json(?)) RETURNING id`,
        (query) => {
          for (const recipe of recipes) {
            const rows = query([
              recipe.createdAt,
              recipe.updatedAt,
              recipe.title,
              recipe.description,
              recipe.source,
              recipe.thumbnail,
              recipe.yield,
              recipe.nutritionCalories,
              recipe.nutritionCarbohydrate,
              recipe.nutritionCholesterol,
              recipe.nutritionFat,
              recipe.nutritionFiber,
              recipe.nutritionProtein,
              recipe.nutritionSaturatedFat,
              recipe.nutritionSodium,
              recipe.nutritionSugar,
              recipe.nutritionTransFat,
              recipe.nutritionUnsaturatedFat,
              recipe.prepTime,
              recipe.cookTime,
              recipe.aggregateRatingValue,
              recipe.aggregateRatingCount,
              recipe.rating,
              JSON.stringify(recipe.ingredients),
              JSON.stringify(recipe.instructions),
            ]);
            recipe.id = rows[0].id;
          }
        },
      );

      for (const recipe of recipes) {
        if (recipe.tags.length) {
          this.tagService.synchronizeRecipes(recipe);
        }

        if (recipe.history.length) {
          this.db.prepare(
            `INSERT INTO recipe_history (recipe_id, timestamp)
             VALUES (?, ?)`,
            (query) => {
              for (const timestamp of recipe.history) {
                query([
                  recipe.id,
                  timestamp,
                ]);
              }
            },
          );
        }

        if (recipe.reviews.length) {
          this.db.prepare(
            `INSERT INTO recipe_review (recipe_id, date, text)
             VALUES (?, ?, ?)`,
            (query) => {
              for (const review of recipe.reviews) {
                query([
                  recipe.id,
                  review.date,
                  review.text,
                ]);
              }
            },
          );
        }
      }
    });
  }

  update(recipes: Recipe[], updateHistory = false): void {
    // TODO update related tables
    // TODO add missing fields
    this.db.transaction(() => {
      this.db.prepare(
        `UPDATE recipe
         SET updated_at                = ?,
             title                     = ?,
             flagged                   = ?,
             description               = ?,
             source                    = ?,
             thumbnail                 = ?,
             yield                     = ?,
             nutrition_calories        = ?,
             nutrition_carbohydrate    = ?,
             nutrition_cholesterol     = ?,
             nutrition_fat             = ?,
             nutrition_fiber           = ?,
             nutrition_protein         = ?,
             nutrition_saturated_fat   = ?,
             nutrition_sodium          = ?,
             nutrition_sugar           = ?,
             nutrition_trans_fat       = ?,
             nutrition_unsaturated_fat = ?,
             prep_time                 = ?,
             cook_time                 = ?,
             aggregate_rating_value    = ?,
             aggregate_rating_count    = ?,
             rating                    = ?,
             ingredients               = json(?),
             instructions              = json(?)
         WHERE id = ?`,
        (query) => {
          for (const recipe of recipes) {
            query([
              recipe.updatedAt,
              recipe.title,
              recipe.flagged,
              recipe.description,
              recipe.source,
              recipe.thumbnail,
              recipe.yield,
              recipe.nutritionCalories,
              recipe.nutritionCarbohydrate,
              recipe.nutritionCholesterol,
              recipe.nutritionFat,
              recipe.nutritionFiber,
              recipe.nutritionProtein,
              recipe.nutritionSaturatedFat,
              recipe.nutritionSodium,
              recipe.nutritionSugar,
              recipe.nutritionTransFat,
              recipe.nutritionUnsaturatedFat,
              recipe.prepTime,
              recipe.cookTime,
              recipe.aggregateRatingValue,
              recipe.aggregateRatingCount,
              recipe.rating,
              JSON.stringify(recipe.ingredients),
              JSON.stringify(recipe.instructions),
              recipe.id,
            ]);
          }
        },
      );

      if (updateHistory) {
        this.db.exec(
          `DELETE
           FROM recipe_history
           WHERE recipe_id IN (${placeholders(recipes)})`,
          recipes.map((r) => r.id),
        );
        this.db.prepare(
          `INSERT INTO recipe_history (recipe_id, timestamp)
           VALUES (?, ?)`,
          (query) => {
            for (const recipe of recipes) {
              for (const date of recipe.history) {
                query([
                  recipe.id,
                  date,
                ]);
              }
            }
          },
        );
      }
    });
  }

  find(
    id: number,
    loadTags?: boolean,
    loadHistory?: boolean,
    loadReviews?: boolean,
  ): Recipe | undefined {
    const result = this.db.single<
      { ingredients: string; instructions: string }
    >(
      `SELECT ${columns(Recipe.columns, "r.")}
       FROM recipe r
       WHERE r.id = ?`,
      [
        id,
      ],
    );
    if (result) {
      const recipe = new Recipe({
        ...toCamelCase(result),
        ...{ ingredients: JSON.parse(result.ingredients) },
        ...{ instructions: JSON.parse(result.instructions) },
      });

      if (loadTags) {
        pushAll(
          this.tagService.list({
            filters: {
              recipeId: recipe.id,
            },
          }),
          recipe.tags,
        );
      }

      if (loadHistory) {
        for (
          const row of this.db.query<{ timestamp: string }>(
            `SELECT timestamp
           FROM recipe_history
           WHERE recipe_id = ?
           ORDER BY timestamp DESC`,
            [recipe.id],
          )
        ) {
          recipe.history.push(toDate(row.timestamp));
        }
      }

      if (loadReviews) {
        for (
          const row of this.db.query(
            `SELECT ${columns(Review.columns)}
           FROM recipe_review
           WHERE recipe_id = ?
           ORDER BY date DESC`,
            [recipe.id],
          )
        ) {
          recipe.reviews.push(new Review(toCamelCase(row)));
        }
      }

      return recipe;
    }

    return undefined;
  }

  delete(recipes: Recipe[]): void {
    this.db.prepare("DELETE FROM recipe WHERE id = ?", (query) => {
      for (const recipe of recipes) {
        query([recipe.id]);
      }
    });
  }
}
