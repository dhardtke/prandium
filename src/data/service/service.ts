export interface Service<T> {
  count: () => number;
  find: (id: number) => T | undefined;
}

export function columns(names: string[], columnPrefix?: string, aliasPrefix?: string): string {
  return names.map(
    (n) => `${columnPrefix ?? ""}${n}${aliasPrefix ? ` AS ${aliasPrefix}${n}` : ""}`
  ).join(", ");
}
