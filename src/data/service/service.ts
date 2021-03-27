export interface Service<T> {
  count: () => number;
  find: (id: number) => T | undefined;
  list: () => T[];
  create: (models: T[]) => void;
  update: (models: T[]) => void;
  delete: (models: T[]) => void;
}
