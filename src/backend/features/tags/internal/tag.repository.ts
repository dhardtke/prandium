import type { DB } from '../../../db/db.ts';
import { type Binding, buildFilters, type Filter, placeholders } from '../../../db/sql.ts';
import type { RecipeId, TagId } from '../../../../shared/flavors.ts';
import type { TagWithCount } from '../ports/tag.ts';

// The recipes that carry every tag in `tagIds`.
function sameRecipeIds(tagIds: readonly TagId[]): Filter {
  return {
    active: tagIds.length > 0,
    sql: () => `recipe_id IN (SELECT recipe_id FROM recipe_tag WHERE tag_id IN (${placeholders(tagIds)}) GROUP BY recipe_id HAVING COUNT(DISTINCT tag_id) = ?)`,
    bindings: () => [...tagIds, tagIds.length],
  };
}

export class TagRepository {
  readonly #db: DB;

  constructor(db: DB) {
    this.#db = db;
  }

  /** Every tag, counting only the recipes that also carry all of `selected`. */
  list(selected: readonly TagId[]): TagWithCount[] {
    const filter = buildFilters({ active: true, sql: () => 'tag_id = t.id' }, sameRecipeIds(selected));
    return this.#db
      .query<TagWithCount, Binding[]>(
        `SELECT t.id, t.title, (SELECT COUNT(*) FROM recipe_tag WHERE ${filter.sql}) AS recipe_count
           FROM tag t
          ORDER BY t.title, t.id`,
      )
      .all(...filter.bindings);
  }

  /** `titles` are trimmed and distinct ignoring case; an existing tag is reused whatever its case. */
  replaceForRecipe(recipeId: RecipeId, titles: readonly string[]): void {
    this.#db.transaction(() => {
      this.#db.query('DELETE FROM recipe_tag WHERE recipe_id = ?').run(recipeId);
      for (const title of titles) {
        const id = this.#findOrCreate(title);
        this.#db.query('INSERT INTO recipe_tag (tag_id, recipe_id) VALUES (?, ?)').run(id, recipeId);
      }
      this.deleteOrphans();
    })();
  }

  deleteOrphans(): void {
    this.#db.run('DELETE FROM tag WHERE id NOT IN (SELECT tag_id FROM recipe_tag)');
  }

  #findOrCreate(title: string): TagId {
    const existing = this.#db
      .query<{ id: TagId }, [string, string]>('SELECT id FROM tag WHERE title = ? COLLATE NOCASE ORDER BY title = ? DESC, id LIMIT 1')
      .get(title, title);
    if (existing) {
      return existing.id;
    }
    const now = new Date().toISOString();
    const created = this.#db
      .query<{ id: TagId }, [string, string, string]>('INSERT INTO tag (title, created_at, updated_at) VALUES (?, ?, ?) RETURNING id')
      .get(title, now, now);
    if (!created) {
      throw new Error('Insert of tag returned no row');
    }
    return created.id;
  }
}
