import { Database } from "../db.ts";
import { Recipe } from "../model/recipe.ts";
import { toArray, toCamelCase } from "../convert.ts";
import { OrderBy, Service } from "./Service.ts";

export class RecipeService implements Service<Recipe> {
  private readonly db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  // TODO filter arguments
  count(): number {
    return this.db.single<{ total: number }>(
      "SELECT COUNT(*) AS total FROM recipe",
    )!.total;
  }

  list(
    limit?: number,
    offset?: number,
    orderBy: OrderBy = OrderBy.EMPTY,
  ): Recipe[] {
    return toArray(
      this.db.query(
        `SELECT id, created_at, updated_at, name, description FROM recipe ${
          orderBy?.sql(Recipe.columns)
        } LIMIT ? OFFSET ?`,
        [
          limit,
          offset,
        ],
      ),
      (src) => new Recipe(toCamelCase(src)),
    );
  }

  save(recipe: Recipe) {
    this.db.exec(
      "INSERT INTO recipe (created_at, updated_at, name, description) VALUES (?, ?, ?, ?)",
      [
        recipe.createdAt,
        recipe.updatedAt,
        recipe.name,
        recipe.description,
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
}
