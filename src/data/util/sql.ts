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

export const EMPTY_FILTER = { sql: "TRUE", bindings: [] };

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
    return EMPTY_FILTER;
  }
}

export const EMPTY_ORDER_BY = "ORDER BY TRUE";

export function buildOrderBySql(
  orderBy: OrderBy | undefined,
  allowedColumns: string[],
): string {
  if (orderBy) {
    if (allowedColumns.includes(orderBy.column)) {
      return `ORDER BY ${orderBy.column}${
        orderBy.order?.toUpperCase() === "DESC" ? " DESC" : ""
      }`;
    }
  }
  return EMPTY_ORDER_BY;
}

export function columns(
  names: (string | undefined)[],
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
