export const ERROR_WHILE_MAPPING_MESSAGE = "Cannot complete the mapping as an error was thrown from an item";

/**
 * Transforms the values of an (async) iterable using `iteratorFn` while running at most `poolLimit` transformations concurrently.
 * Results are yielded in the order of the input values. Errors thrown by `iteratorFn` do not stop the remaining transformations; they are collected
 * and rethrown as an {@link AggregateError} after all successful results have been yielded (same semantics as `pooledMap` from `@std/async`).
 */
export async function* pooledMap<T, R>(poolLimit: number, iterable: Iterable<T> | AsyncIterable<T>, iteratorFn: (data: T) => Promise<R>): AsyncGenerator<R> {
    const results: Promise<PromiseSettledResult<R>>[] = [];
    const executing = new Set<Promise<unknown>>();

    for await (const item of iterable) {
        const settled = Promise.resolve()
            .then(() => iteratorFn(item))
            .then(
                (value): PromiseSettledResult<R> => ({ status: "fulfilled", value }),
                (reason): PromiseSettledResult<R> => ({ status: "rejected", reason }),
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
        if (settled.status === "fulfilled") {
            yield settled.value;
        } else {
            errors.push(settled.reason);
        }
    }
    if (errors.length) {
        throw new AggregateError(errors, ERROR_WHILE_MAPPING_MESSAGE);
    }
}
