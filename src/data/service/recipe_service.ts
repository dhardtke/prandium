import {
  extractPrefixed,
  reduceFirst,
  toArray,
  toCamelCase,
  toDate,
} from "../convert.ts";
import { Database } from "../db.ts";
import { OrderBy } from "../util/order_by.ts";
import { Recipe } from "../model/recipe.ts";
import { Tag } from "../model/tag.ts";
import { columns, Service } from "./service.ts";
import { TagService } from "./tag_service.ts";

export class RecipeService implements Service<Recipe> {
  private readonly db: Database;
  private readonly tagService: TagService;

  constructor(db: Database, tagService: TagService) {
    this.db = db;
    this.tagService = tagService;
  }

  count(filters?: {
    tagId?: number;
  }): number {
    return this.db.single<{ total: number }>(
      "SELECT COUNT(*) AS total FROM recipe",
      [
        // TODO support filtering by tagId
        // filters?.bookId,
      ],
    )!.total;
  }

  list(
    limit?: number,
    offset?: number,
    orderBy: OrderBy = OrderBy.EMPTY,
    // TODO use Filter object
    filters?: {
      bookId?: number;
    },
  ): Recipe[] {
    return toArray(
      this.db.query(
        `SELECT ${columns(Recipe.columns)} FROM recipe ${
          orderBy.sql(Recipe.columns)
        } LIMIT ? OFFSET ?`,
        [
          limit || -1,
          offset || 0,
        ],
      ),
      (src) => new Recipe(toCamelCase(src)),
    );
  }

  create(recipe: Recipe): Recipe {
    this.db.exec(
      `INSERT INTO recipe (created_at, updated_at, title, description, source, thumbnail, yield, prep_time, cook_time, rating, ingredients,
                           instructions)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        recipe.createdAt,
        recipe.updatedAt,
        recipe.title,
        recipe.description,
        recipe.source,
        recipe.thumbnail,
        recipe.yield,
        recipe.prepTime,
        recipe.cookTime,
        recipe.rating,
        JSON.stringify(recipe.ingredients),
        JSON.stringify(recipe.instructions),
      ],
    );
    recipe.id = this.db.lastInsertRowId;

    if (recipe.tags.length) {
      this.tagService.synchronize(recipe);
    }

    if (recipe.history.length) {
      recipe.history.forEach((timestamp) => {
        this.db.exec(
          `INSERT INTO recipe_history (recipe_id, timestamp)
           VALUES (?, ?)`,
          [
            recipe.id,
            timestamp,
          ],
        );
      });
    }

    return recipe;
  }

  update(recipe: Recipe): Recipe {
    // TODO update related tables
    // TODO add missing fields
    this.db.exec(
      "UPDATE recipe SET updated_at = ?, title = ?, description = ? WHERE id = ?",
      [recipe.updatedAt, recipe.title, recipe.description, recipe.id],
    );
    return recipe;
  }

  find(
    id: number,
    loadTags?: boolean,
    loadHistory?: boolean,
  ): Recipe | undefined {
    return reduceFirst(
      this.db.query<{ ingredients: string; instructions: string }>(
        `SELECT
                ${columns(Recipe.columns, "r.")}
                ${loadTags ? `, ${columns(Tag.columns, "t.", "_t_")}` : ""}
                ${
          loadHistory ? `, ${columns(["timestamp"], "rh.", "_rh_")}` : ""
        }
         FROM recipe r
                ${
          loadTags
            ? `LEFT JOIN recipe_tag rt on rt.recipe_id = r.id LEFT JOIN tag t ON t.id = rt.tag_id`
            : ""
        }
                ${
          loadHistory
            ? `LEFT JOIN recipe_history rh on rh.recipe_id = r.id`
            : ""
        }
         WHERE r.id = ?
          ${loadHistory ? `ORDER BY rh.timestamp ASC` : ""}
          ${loadTags ? `, t.title ASC` : ""}`, // TODO multiple ORDER BY clauses
        [
          id,
        ],
      ),
      (row) =>
        new Recipe({
          ...toCamelCase(row),
          ...{ ingredients: JSON.parse(row.ingredients) },
          ...{ instructions: JSON.parse(row.instructions) },
        }),
      (recipe, row, state) => {
        if (loadTags) {
          const tagRow = extractPrefixed<
            unknown & { title: string },
            typeof row
          >(row, "_t_");
          if (!state.tags.has(tagRow.title)) {
            recipe.tags.push(new Tag(toCamelCase(tagRow)));
            state.tags.add(tagRow.title);
          }
        }
        if (loadHistory) {
          const timestamp =
            extractPrefixed<{ timestamp: Date }, unknown>(row, "_rh_")
              .timestamp;
          if (!state.timestamps.has(timestamp)) {
            recipe.history.push(toDate(timestamp));
            state.timestamps.add(timestamp);
          }
        }
      },
      {
        tags: new Set<string>(),
        timestamps: new Set<Date>(),
      },
    );
  }
}
