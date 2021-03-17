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
}
