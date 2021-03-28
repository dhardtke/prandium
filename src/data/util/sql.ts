import { QueryParam } from "../db.ts";
import { OrderBy } from "../service/service.ts";

export interface Filter {
  active: boolean;
  sql: () => string;
  bindings?: () => QueryParam[];
}

export interface Filters {
  sql: string;
  bindings: QueryParam[];
}

export function buildFilters(...filters: Filter[]): Filters {
  const activeFilters = filters.filter((f) => f.active);
  if (activeFilters.length) {
    return activeFilters.reduce((result: Filters, { sql, bindings }, i) => {
      result.sql += `${i === 0 ? "" : " AND "}${sql()}`;
      const effectiveBindings = bindings ? bindings() : [];
      if (effectiveBindings.length) {
        result.bindings = [...result.bindings, ...effectiveBindings];
      }
      return result;
    }, { sql: "", bindings: [] });
  } else {
    return { sql: "TRUE", bindings: [] };
  }
}

export function buildOrderBySql(
  orderBy: OrderBy | undefined,
  allowedColumns: string[],
): string {
  const source: Map<string, boolean> = orderBy === undefined
    ? new Map()
    : orderBy instanceof Map
    ? orderBy
    : new Map(Object.entries(orderBy));
  const columns = Array.from(source.keys())
    .filter((col) => allowedColumns.includes(col))
    .map((col) => `${col}${source.get(col) ? " DESC" : ""}`);

  return `ORDER BY ${columns.length ? columns.join(", ") : "TRUE"}`;
}

export function columns(
  names: string[],
  columnPrefix?: string,
  aliasPrefix?: string,
): string {
  return names
    .filter((name) => Boolean(name))
    .map((n) =>
      `${columnPrefix ?? ""}${n}${aliasPrefix ? ` AS ${aliasPrefix}${n}` : ""}`
    )
    .join(", ");
}

export function placeholders<T>(count: T[] | number | undefined): string {
  if (count === undefined) {
    return "";
  }
  const howMany = typeof count === "number" ? count : count.length;
  return Array.from(Array(howMany)).map(() => "?").join(", ");
}
