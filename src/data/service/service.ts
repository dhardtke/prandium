// columnName => descending?
export type OrderBy = Map<string, boolean> | { [columnName: string]: boolean };

export interface Service<T> {
  count: () => number;
  find: (id: number) => T | undefined;
  list: (args: { limit?: number; offset?: number; orderBy?: OrderBy }) => T[];
  create: (models: T[]) => void;
  update: (models: T[]) => void;
  delete: (models: T[]) => void;
}
