import { QueryParam } from "../db.ts";

export class OrderBy {
  public static EMPTY: OrderBy = new OrderBy();

  private readonly column?: string;
  private readonly order?: string;

  public constructor(column?: string, order?: string) {
    this.column = column;
    this.order = order;
  }

  public sql(allowedColumns: string[]): string {
    if (
      !this.column || !allowedColumns.includes(this.column) ||
      !["desc", "asc", undefined].includes(this?.order?.toLowerCase())
    ) {
      return "";
    }

    return `ORDER BY ${this.column}${this.order || ""}`.trim();
  }

  public combine(other: OrderBy): OrderBy {
    return new OrderBy(); // TODO
  }

  public static combined(...values: string[]): string {
    return values.length ? values.filter((s) => Boolean(s)).join(",") : "1";
  }
}

export interface Filter {
  active: boolean;
  sql: () => string;
  bindings?: QueryParam[];
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
      if (bindings?.length) {
        result.bindings = [...result.bindings, ...bindings];
      }
      return result;
    }, { sql: "", bindings: [] });
  } else {
    return { sql: "TRUE", bindings: [] };
  }
}
