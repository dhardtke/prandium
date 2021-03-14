export interface Service<T> {
  count: () => number;
  find: (id: number) => T | undefined;
}
