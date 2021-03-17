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

export class Filter<T extends Record<string, string>> {
  public static EMPTY: Filter<Record<string, string>> = new Filter();

  private readonly parameters?: T;

  public constructor(parameters?: T) {
    this.parameters = parameters;
  }

  public sql(): string {
    if (!this.parameters) {
      return "";
    }
    return `()`;
  }

  public values(): Record<string, string> {
    return this.parameters!;
  }
}
