import { Database } from "../db.ts";
import { Recipe } from "../model/recipe.ts";
import { Tag } from "../model/tag.ts";
import { toArray, toCamelCase } from "../util/convert.ts";
import {
  buildFilters,
  columns,
  Filter,
  OrderBy,
  placeholders,
} from "../util/sql.ts";
import { Service } from "./service.ts";

function recipeFilter(recipeId?: number): Filter {
  return {
    active: Boolean(recipeId),
    sql: () => `id IN (SELECT tag_id FROM recipe_tag WHERE recipe_id = ?)`,
    bindings: () => [recipeId],
  };
}

function tagsWithSameRecipes(tagIds?: number[]): Filter {
  return {
    active: Boolean(tagIds?.length),
    sql: () =>
      `id IN (
      SELECT tag_id FROM recipe_tag WHERE recipe_id IN (
        SELECT recipe_id FROM recipe_tag WHERE recipe_tag.tag_id IN (${
        placeholders(tagIds)
      }) GROUP BY recipe_id HAVING COUNT(*) = ?
      )
    )`,
    bindings: () => [...tagIds!, tagIds!.length],
  };
}

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
    loadRecipeCount?: boolean,
    filters?: {
      recipeId?: number;
      tagIdsWithSameRecipes?: number[];
    },
  ): Tag[] {
    // TODO support loadRecipes
    const filter = buildFilters(
      recipeFilter(filters?.recipeId),
      tagsWithSameRecipes(filters?.tagIdsWithSameRecipes),
    );
    return toArray(
      this.db.query(
        `SELECT ${columns(Tag.columns)} FROM tag ${
          orderBy?.sql(Tag.columns)
        } WHERE ${filter.sql} LIMIT ? OFFSET ?`,
        [
          ...filter.bindings,
          limit || -1,
          offset || 0,
        ],
      ),
      (src) => new Tag(toCamelCase(src)),
    );
  }

  create(tags: Tag[]): void {
    this.db.transaction(() => {
      this.db.prepare(
        `INSERT INTO tag (created_at, updated_at, title, description)
         VALUES (?, ?, ?, ?) RETURNING id`,
        (query) => {
          for (const tag of tags) {
            const rows = query([
              tag.createdAt,
              tag.updatedAt,
              tag.title,
              tag.description || "",
            ]);
            tag.id = [...rows.asObjects()][0].id;
          }
        },
      );

      this.db.prepare(
        `INSERT INTO recipe_tag (tag_id, recipe_id)
         VALUES (?, ?)`,
        (query) => {
          for (const tag of tags) {
            for (const recipe of tag.recipes) {
              query([tag.id!, recipe.id!]);
            }
          }
        },
      );
    });
  }

  update(tags: Tag[]): void {
    this.db.prepare(
      "UPDATE tag SET updated_at = ?, title = ?, description = ? WHERE id = ?",
      (query) => {
        for (const tag of tags) {
          query([tag.updatedAt, tag.title, tag.description, tag.id]);
        }
      },
    );
  }

  delete(tags: Tag[]): void {
    // TODO
  }

  find(id: number): Tag | undefined {
    const result = this.db.single(
      `SELECT ${columns(Tag.columns)} FROM tag WHERE id = ?`,
      [id],
    );
    return result ? new Tag(toCamelCase(result)) : undefined;
  }

  synchronizeIds(tags: Tag[]): void {
    const titleToTags: { [title: string]: Tag } = {};
    for (const tag of tags) {
      titleToTags[tag.title] = tag;
    }
    const titles = Object.keys(titleToTags);
    for (
      const row of this.db.query<Tag>(
        `SELECT id, title FROM tag WHERE title IN (${
          titles.map(() => "?").join(", ")
        })`,
        titles,
      )
    ) {
      titleToTags[row.title].id = row.id;
    }
  }

  synchronizeRecipes(recipe: Recipe) {
    this.db.transaction(() => {
      this.db.exec("DELETE FROM recipe_tag WHERE recipe_id = ?", [recipe.id]);

      this.synchronizeIds(recipe.tags);
      this.create(recipe.tags.filter((tag) => !tag.id));
      this.db.prepare(
        `INSERT INTO recipe_tag (tag_id, recipe_id)
         VALUES (?, ?)`,
        (query) => {
          for (const tag of recipe.tags) {
            query([tag.id, recipe.id]);
          }
        },
      );
    });
  }
}
