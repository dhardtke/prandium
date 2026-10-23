export const ERROR_WHILE_MAPPING_MESSAGE = 'Cannot complete the mapping as an error was thrown from an item';

/**
 * Maps `iterable` through `iteratorFn` with at most `poolLimit` calls running at once, yielding in input order. A rejection does not stop the
 * others; all of them are rethrown together as an AggregateError once every result has been yielded (`pooledMap` of `@std/async`).
 */
export async function* pooledMap<T, R>(poolLimit: number, iterable: Iterable<T> | AsyncIterable<T>, iteratorFn: (data: T) => Promise<R>): AsyncGenerator<R> {
  const results: Promise<PromiseSettledResult<R>>[] = [];
  const executing = new Set<Promise<unknown>>();

  for await (const item of iterable) {
    const settled = Promise.resolve()
      .then(() => iteratorFn(item))
      .then(
        (value): PromiseSettledResult<R> => ({ status: 'fulfilled', value }),
        (reason: unknown): PromiseSettledResult<R> => ({ status: 'rejected', reason }),
      );
    results.push(settled);
    const running: Promise<unknown> = settled.then(() => executing.delete(running));
    executing.add(running);
    if (executing.size >= poolLimit) {
      await Promise.race(executing);
    }
  }

  const errors: unknown[] = [];
  for (const result of results) {
    const settled = await result;
    if (settled.status === 'fulfilled') {
      yield settled.value;
    } else {
      errors.push(settled.reason);
    }
  }
  if (errors.length > 0) {
    throw new AggregateError(errors, ERROR_WHILE_MAPPING_MESSAGE);
  }
}
