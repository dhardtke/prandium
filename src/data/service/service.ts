export interface Service<T> {
  count: () => number;
  find: (id: number) => T | undefined;
  list: () => T[];
  create: (models: T[]) => void;
  update: (models: T[]) => void;
  delete: (models: T[]) => void;
}

export function columns(
  names: string[],
  columnPrefix?: string,
  aliasPrefix?: string,
): string {
  return names.map(
    (n) =>
      `${columnPrefix ?? ""}${n}${aliasPrefix ? ` AS ${aliasPrefix}${n}` : ""}`,
  ).join(", ");
}
