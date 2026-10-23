export function isUniqueViolation(err: unknown): boolean {
  return err instanceof Error && /UNIQUE constraint failed/i.test(err.message);
}

export function isForeignKeyViolation(err: unknown): boolean {
  return err instanceof Error && 'code' in err && err.code === 'SQLITE_CONSTRAINT_FOREIGNKEY';
}

export interface UpdateStatement {
  sql: string;
  values: (string | number | null)[];
}

// Columns come only from the hard-coded `fields`, never the patch's keys, so a body cannot inject SQL.
export function buildUpdate<T extends object>(table: string, fields: readonly Extract<keyof T, string>[], patch: Partial<T>): UpdateStatement | null {
  const assignments: string[] = [];
  const values: (string | number | null)[] = [];

  for (const field of fields) {
    const value = patch[field];
    // An undefined field is left alone, while null clears the column.
    if (value !== undefined) {
      if (value !== null && typeof value !== 'string' && typeof value !== 'number') {
        throw new TypeError(`Cannot bind ${table}.${field}: expected a string, a number or null`);
      }
      assignments.push(`${field} = ?`);
      values.push(value);
    }
  }

  if (assignments.length === 0) {
    return null;
  }
  return { sql: `UPDATE ${table} SET ${assignments.join(', ')} WHERE id = ?`, values };
}

export type Binding = string | number | null;

export interface Filter {
  active: boolean;
  sql: () => string;
  bindings?: () => Binding[];
}

export interface Filters {
  sql: string;
  bindings: Binding[];
}

export const EMPTY_FILTER: Filters = { sql: 'TRUE', bindings: [] };

/** ANDs the active filters into one WHERE condition, `TRUE` when none is active. */
export function buildFilters(...filters: Filter[]): Filters {
  const active = filters.filter((filter) => filter.active);
  if (active.length === 0) {
    return EMPTY_FILTER;
  }
  return {
    sql: active.map((filter) => filter.sql()).join(' AND '),
    bindings: active.flatMap((filter) => filter.bindings?.() ?? []),
  };
}

export const EMPTY_ORDER_BY = 'ORDER BY TRUE';

// Only a column from `allowed` reaches the SQL, so a query string cannot inject any.
export function buildOrderBySql(orderBy: { column: string; order?: string } | undefined, allowed: readonly string[]): string {
  if (!orderBy || !allowed.includes(orderBy.column)) {
    return EMPTY_ORDER_BY;
  }
  return `ORDER BY ${orderBy.column}${orderBy.order?.toUpperCase() === 'DESC' ? ' DESC' : ''}`;
}

export function placeholders(count: number | readonly unknown[]): string {
  const n = typeof count === 'number' ? count : count.length;
  return Array.from({ length: n }, () => '?').join(', ');
}

/** For `LIKE ? ESCAPE '\'`. */
export function likePattern(text: string): string {
  return `%${text.replace(/[\\%_]/g, '\\$&')}%`;
}
