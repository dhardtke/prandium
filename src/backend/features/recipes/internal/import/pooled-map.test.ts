import { describe, expect, test } from 'bun:test';
import { ERROR_WHILE_MAPPING_MESSAGE, pooledMap } from './pooled-map.ts';

async function collect<T>(iterable: AsyncIterable<T>): Promise<T[]> {
  const result: T[] = [];
  for await (const item of iterable) {
    result.push(item);
  }
  return result;
}

describe('pooledMap', () => {
  test('Given a pool limit of 2 Then at most 2 transformations run concurrently', async () => {
    let running = 0;
    let maxRunning = 0;

    const results = await collect(
      pooledMap(2, [1, 2, 3, 4, 5], async (i) => {
        running++;
        maxRunning = Math.max(maxRunning, running);
        await Bun.sleep(5);
        running--;
        return i;
      }),
    );

    expect(results).toEqual([1, 2, 3, 4, 5]);
    expect(maxRunning).toEqual(2);
  });

  test('Results are yielded in the order of the input values even if later values finish first', async () => {
    const results = await collect(
      pooledMap(3, [30, 10, 20], async (delay) => {
        await Bun.sleep(delay);
        return delay * 2;
      }),
    );

    expect(results).toEqual([60, 20, 40]);
  });

  test('Async iterables are supported as input', async () => {
    async function* input(): AsyncGenerator<number> {
      yield await Promise.resolve(1);
      yield 2;
    }

    expect(await collect(pooledMap(1, input(), (i) => Promise.resolve(i + 1)))).toEqual([2, 3]);
  });

  test('When a transformation throws Then the remaining values are still transformed and an AggregateError is thrown at the end', async () => {
    const processed: number[] = [];
    const yielded: number[] = [];

    let error: unknown;
    try {
      for await (const value of pooledMap(1, [1, 2, 3], (i) => {
        processed.push(i);
        return i === 2 ? Promise.reject(new Error('boom')) : Promise.resolve(i);
      })) {
        yielded.push(value);
      }
    } catch (e) {
      error = e;
    }

    expect(processed).toEqual([1, 2, 3]);
    expect(yielded).toEqual([1, 3]);
    expect(error).toBeInstanceOf(AggregateError);
    expect(error).toMatchObject({ message: ERROR_WHILE_MAPPING_MESSAGE, errors: [new Error('boom')] });
  });
});
