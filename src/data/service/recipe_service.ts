import { Database } from "../db.ts";
import { Recipe } from "../model/recipe.ts";
import { toArray, toCamelCase } from "../convert.ts";
import { Service } from "./service.ts";
import { OrderBy } from "../helper/order_by.ts";

export class RecipeService implements Service<Recipe> {
  private readonly db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  count(filters?: {
    bookId?: number;
  }): number {
    return this.db.single<{ total: number }>(
      "SELECT COUNT(*) AS total FROM recipe WHERE book_id = ?",
      [
        filters?.bookId,
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
        `SELECT id, created_at, updated_at, name, description, book_id FROM recipe ${
          orderBy.sql(Recipe.columns)
        } WHERE book_id = ? LIMIT ? OFFSET ?`,
        [
          filters?.bookId,
          limit || -1,
          offset || 0,
        ],
      ),
      (src) => new Recipe(toCamelCase(src)),
    );
  }

  save(recipe: Recipe) {
    this.db.exec(
      "INSERT INTO recipe (created_at, updated_at, name, description, book_id) VALUES (?, ?, ?, ?, ?)",
      [
        recipe.createdAt,
        recipe.updatedAt,
        recipe.name,
        recipe.description,
        recipe.bookId,
      ],
    );
    recipe.id = this.db.lastInsertRowId;
  }

  update(recipe: Recipe) {
    this.db.exec(
      "UPDATE recipe SET updated_at = ?, name = ?, description = ? WHERE id = ?",
      [recipe.updatedAt, recipe.name, recipe.description, recipe.id],
    );
  }

  find(id: number): Recipe | undefined {
    return undefined;
  }
}