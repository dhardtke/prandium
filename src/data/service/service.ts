export interface OrderBy {
  column: string;
  order?: "ASC" | "DESC";
}

export interface Service<T> {
  count: () => number;
  find: (id: number) => T | undefined;
  list: (args: { limit?: number; offset?: number; orderBy?: OrderBy }) => T[];
  create: (models: T[]) => void;
  update: (models: T[]) => void;
  delete: (models: T[]) => void;
}
