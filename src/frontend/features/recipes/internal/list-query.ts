import type { RecipeSortKey, SortOrder } from '../../../../shared/dto/recipe.ts';
import type { TagId } from '../../../../shared/flavors.ts';

export const PAGE_SIZE = 24;
export const MAX_SEARCH_LENGTH = 500;

// The backend's allowlist, copied because src/shared/ holds types only; list-query.test.ts pins the two together.
export const RECIPE_SORT_KEYS = [
  'id',
  'title',
  'cooked_count',
  'flagged',
  'aggregate_rating_value',
  'rating',
  'created_at',
  'updated_at',
  'last_cooked_at',
  'prep_time',
  'cook_time',
  'total_time',
  'nutrition_calories',
  'nutrition_carbohydrate',
  'nutrition_cholesterol',
  'nutrition_fat',
  'nutrition_fiber',
  'nutrition_protein',
  'nutrition_saturated_fat',
  'nutrition_sodium',
  'nutrition_sugar',
  'nutrition_trans_fat',
  'nutrition_unsaturated_fat',
] as const satisfies readonly RecipeSortKey[];

export const DEFAULT_SORT: RecipeSortKey = 'title';

export interface ListQuery {
  search: string;
  tags: TagId[];
  sort: RecipeSortKey;
  order: SortOrder;
  page: number;
  /** Whether the tag panel is open. */
  tagsOpen: boolean;
}

// The old server-rendered list wrote `nutrition_saturatedFat` into its sort select.
const LEGACY_SORT: Readonly<Record<string, RecipeSortKey>> = { nutrition_saturatedFat: 'nutrition_saturated_fat' };

function sortKey(value: string | null): RecipeSortKey {
  const key = value === null ? undefined : (LEGACY_SORT[value] ?? value);
  return RECIPE_SORT_KEYS.find((candidate) => candidate === key) ?? DEFAULT_SORT;
}

function ids(values: string[]): TagId[] {
  const parsed = values.filter((value) => /^\d+$/.test(value) && Number(value) >= 1).map(Number);
  return [...new Set(parsed)];
}

/** Reads `/`'s query string; the old names `title`, `tagId`, `orderBy` and `tagFilter` still work. */
export function parseListQuery(search: string): ListQuery {
  const params = new URLSearchParams(search);
  const text = (params.get('search') ?? params.get('title') ?? '').trim();
  const page = params.get('page') ?? '';
  return {
    search: text.length > MAX_SEARCH_LENGTH ? '' : text,
    tags: ids([...params.getAll('tag'), ...params.getAll('tagId')]),
    sort: sortKey(params.get('sort') ?? params.get('orderBy')),
    order: (params.get('order') ?? '').toLowerCase() === 'desc' ? 'desc' : 'asc',
    page: /^\d+$/.test(page) && Number(page) >= 1 ? Number(page) : 1,
    tagsOpen: params.has('tags') || params.has('tagFilter'),
  };
}

/** The canonical path for `query`, leaving defaults out. */
export function listPath(query: ListQuery): string {
  const params = new URLSearchParams();
  if (query.search !== '') {
    params.set('search', query.search);
  }
  for (const tag of query.tags) {
    params.append('tag', String(tag));
  }
  if (query.sort !== DEFAULT_SORT) {
    params.set('sort', query.sort);
  }
  if (query.order !== 'asc') {
    params.set('order', query.order);
  }
  if (query.page !== 1) {
    params.set('page', String(query.page));
  }
  if (query.tagsOpen) {
    params.set('tags', '');
  }
  // `tags=` reads better as a bare flag.
  const search = params.toString().replace(/(^|&)tags=(?=&|$)/, '$1tags');
  return search === '' ? '/' : `/?${search}`;
}
