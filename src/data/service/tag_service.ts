import { toArray, toCamelCase } from "../convert.ts";
import { Database } from "../db.ts";
import { Recipe } from "../model/recipe.ts";
import { Tag } from "../model/tag.ts";
import { OrderBy } from "../util/order_by.ts";
import { columns, Service } from "./service.ts";

export class TagService implements Service<Tag> {
  private readonly db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  // TODO filter arguments
  count(): number {
    return this.db.single<{ total: number }>(
      "SELECT COUNT(*) AS total FROM tag",
    )!.total;
  }

  list(
    limit?: number,
    offset?: number,
    orderBy: OrderBy = OrderBy.EMPTY,
    loadRecipes?: boolean,
  ): Tag[] {
    // TODO support loadRecipes
    return toArray(
      this.db.query(
        `SELECT ${columns(Tag.columns)} FROM tag ${
          orderBy?.sql(Tag.columns)
        } LIMIT ? OFFSET ?`,
        [
          limit,
          offset,
        ],
      ),
      (src) => new Tag(toCamelCase(src)),
    );
  }

  create(tag: Tag): Tag {
    this.db.exec(
      "INSERT INTO tag (created_at, updated_at, title, description) VALUES (?, ?, ?, ?)",
      [
        tag.createdAt,
        tag.updatedAt,
        tag.title,
        tag.description,
      ],
    );
    tag.id = this.db.lastInsertRowId;

    const values: number[] = [];
    let recipes = 0;
    for (const recipe of tag.recipes) {
      values.push(tag.id);
      values.push(recipe.id!);
      recipes++;
    }
    if (values.length) {
      this.db.exec(
        `INSERT INTO recipe_tag (tag_id, recipe_id) VALUES ${
          Array.from(Array(recipes)).map(() => "(?, ?)").join(", ")
        }`,
        values,
      );
    }
    return tag;
  }

  update(tag: Tag): Tag {
    this.db.exec(
      "UPDATE tag SET updated_at = ?, title = ?, description = ? WHERE id = ?",
      [tag.updatedAt, tag.title, tag.description, tag.id],
    );
    return tag;
  }

  find(id: number): Tag | undefined {
    const result = this.db.single(
      `SELECT ${columns(Tag.columns)} FROM tag WHERE id = ?`,
      [id],
    );
    return result ? new Tag(toCamelCase(result)) : undefined;
  }

  synchronize(recipe: Recipe) {
    this.db.exec("DELETE FROM recipe_tag WHERE recipe_id = ?", [recipe.id]);
    recipe.tags.forEach((tag) => {
      this.db.exec(
        `INSERT INTO recipe_tag (tag_id, recipe_id)
         VALUES (?, ?)`,
        [
          tag.id,
          recipe.id,
        ],
      );
    });
  }
}
