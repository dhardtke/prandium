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
