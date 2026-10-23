import type { DB } from '../../../db/db.ts';
import { type Binding, buildFilters, buildOrderBySql, type Filter, likePattern } from '../../../db/sql.ts';
import type { RecipeId, TagId } from '../../../../shared/flavors.ts';
import type { TagFacade } from '../../tags/tags.facade.ts';
import {
  NUTRITION_COLUMNS,
  type NutritionColumn,
  RECIPE_SORT_KEYS,
  type RecipeDetails,
  type RecipeFilter,
  type RecipeRow,
  type RecipeSort,
  type RecipeSummaryRow,
  type RecipeTagRow,
  type ReviewRow,
} from '../ports/recipe.ts';

export type CreateRecipe = {
  title: string;
  flagged: number;
  description: string;
  source: string;
  thumbnail: string | null;
  yield: number;
  prep_time: number;
  cook_time: number;
  aggregate_rating_value: number | null;
  aggregate_rating_count: number | null;
  rating: number;
  ingredients: string[];
  instructions: string[];
  history: string[];
  tags: string[];
  reviews: ReviewRow[];
} & Record<NutritionColumn, string | null>;

const SCALAR_COLUMNS = [
  'title',
  'flagged',
  'description',
  'source',
  'thumbnail',
  'yield',
  ...NUTRITION_COLUMNS,
  'prep_time',
  'cook_time',
  'aggregate_rating_value',
  'aggregate_rating_count',
  'rating',
] as const;

const RECIPE_COLUMNS = ['id', ...SCALAR_COLUMNS, 'ingredients', 'instructions', 'created_at', 'updated_at'].map((column) => `r.${column}`).join(', ');

const SUMMARY_COLUMNS = `r.id, r.title, r.flagged, r.description, r.thumbnail, r.rating, r.aggregate_rating_value, r.aggregate_rating_count,
  COALESCE(r.prep_time, 0) + COALESCE(r.cook_time, 0)                    AS total_time,
  (SELECT COUNT(*) FROM recipe_history h WHERE h.recipe_id = r.id)       AS cooked_count,
  (SELECT MAX(h.timestamp) FROM recipe_history h WHERE h.recipe_id = r.id) AS last_cooked_at`;

function titleFilter(title: string | undefined): Filter {
  return { active: title !== undefined && title !== '', sql: () => "r.title LIKE ? ESCAPE '\\'", bindings: () => [likePattern(title ?? '')] };
}

function tagFilter(tagIds: readonly TagId[] | undefined): Filter {
  const ids = tagIds ?? [];
  return {
    active: ids.length > 0,
    sql: () => ids.map(() => 'EXISTS (SELECT TRUE FROM recipe_tag WHERE tag_id = ? AND recipe_id = r.id)').join(' AND '),
    bindings: () => [...ids],
  };
}

function filters(filter: RecipeFilter): { sql: string; bindings: Binding[] } {
  return buildFilters(titleFilter(filter.title_contains), tagFilter(filter.tag_ids));
}

export class RecipeRepository {
  readonly #db: DB;
  readonly #tags: TagFacade;

  constructor(db: DB, tags: TagFacade) {
    this.#db = db;
    this.#tags = tags;
  }

  /** Ordered by the sort column, then by id, so pages never overlap. */
  list(filter: RecipeFilter, sort: RecipeSort, limit: number, offset: number): RecipeSummaryRow[] {
    const { sql, bindings } = filters(filter);
    const orderBy = buildOrderBySql(sort, RECIPE_SORT_KEYS);
    return this.#db
      .query<RecipeSummaryRow, Binding[]>(`SELECT ${SUMMARY_COLUMNS} FROM recipe r WHERE ${sql} ${orderBy}, r.id LIMIT ? OFFSET ?`)
      .all(...bindings, limit, offset);
  }

  count(filter: RecipeFilter): number {
    const { sql, bindings } = filters(filter);
    return this.#db.query<{ n: number }, Binding[]>(`SELECT COUNT(*) AS n FROM recipe r WHERE ${sql}`).get(...bindings)?.n ?? 0;
  }

  find(id: RecipeId): RecipeDetails | null {
    const recipe = this.#db.query<RecipeRow, [RecipeId]>(`SELECT ${RECIPE_COLUMNS} FROM recipe r WHERE r.id = ?`).get(id);
    if (!recipe) {
      return null;
    }
    const tags = this.#db
      .query<RecipeTagRow, [RecipeId]>('SELECT t.id, t.title FROM tag t JOIN recipe_tag rt ON rt.tag_id = t.id WHERE rt.recipe_id = ? ORDER BY t.title, t.id')
      .all(id);
    const history = this.#db
      .query<{ timestamp: string }, [RecipeId]>('SELECT timestamp FROM recipe_history WHERE recipe_id = ? ORDER BY timestamp DESC')
      .all(id)
      .map((row) => row.timestamp);
    const reviews = this.#db.query<ReviewRow, [RecipeId]>('SELECT date, text FROM recipe_review WHERE recipe_id = ? ORDER BY date DESC, id').all(id);
    return { recipe, tags, history, reviews };
  }

  create(input: CreateRecipe): RecipeId {
    return this.#db.transaction(() => {
      const now = new Date().toISOString();
      const columns = [...SCALAR_COLUMNS, 'ingredients', 'instructions', 'created_at', 'updated_at'];
      const values: Binding[] = [
        ...SCALAR_COLUMNS.map((column) => input[column]),
        JSON.stringify(input.ingredients),
        JSON.stringify(input.instructions),
        now,
        now,
      ];
      const row = this.#db
        .query<{ id: RecipeId }, Binding[]>(`INSERT INTO recipe (${columns.join(', ')}) VALUES (${columns.map(() => '?').join(', ')}) RETURNING id`)
        .get(...values);
      if (!row) {
        throw new Error('Insert of recipe returned no row');
      }
      this.#insertHistory(row.id, input.history);
      for (const review of input.reviews) {
        this.#db.query('INSERT INTO recipe_review (recipe_id, date, text) VALUES (?, ?, ?)').run(row.id, review.date, review.text);
      }
      this.#tags.replaceForRecipe(row.id, input.tags);
      return row.id;
    })();
  }

  // (recipe_id, timestamp) is the primary key, so a repeated entry is stored once.
  #insertHistory(id: RecipeId, history: readonly string[]): void {
    for (const timestamp of new Set(history)) {
      this.#db.query('INSERT INTO recipe_history (recipe_id, timestamp) VALUES (?, ?)').run(id, timestamp);
    }
  }
}
