import { describe, expect, test } from 'bun:test';
import { useFetch } from '../testing.ts';
import { ApiError, UNAUTHORIZED_EVENT } from './errors.ts';
import { get, patch, post, put, remove } from './http.ts';

const fetch = useFetch();

async function rejection(promise: Promise<unknown>): Promise<ApiError> {
  const error = await promise.then(
    () => null,
    (cause: unknown) => cause,
  );
  expect(error).toBeInstanceOf(ApiError);
  if (!(error instanceof ApiError)) {
    throw new TypeError('expected an ApiError');
  }
  return error;
}

describe('requests', () => {
  test('prefix the path with /api', async () => {
    await get('/workouts');

    expect(fetch.requests).toEqual([{ method: 'GET', url: '/api/workouts', headers: {}, body: undefined }]);
  });

  test.each([
    ['POST', post],
    ['PUT', put],
    ['PATCH', patch],
  ] as const)('%s sends its body as JSON', async (method, send) => {
    await send('/sets/1', { reps: 5, note: 'easy' });

    expect(fetch.requests).toEqual([{ method, url: '/api/sets/1', headers: { 'content-type': 'application/json' }, body: { reps: 5, note: 'easy' } }]);
  });

  test.each([
    ['POST', post],
    ['PUT', put],
    ['PATCH', patch],
  ] as const)('%s without a body still sends an empty object, so the server always gets JSON', async (method, send) => {
    await send('/workouts');

    expect(fetch.requests[0]).toMatchObject({ method, body: {} });
  });

  test('DELETE sends no body and no content type', async () => {
    fetch.respondWith(204);

    expect(await remove('/workouts/3')).toBeNull();
    expect(fetch.requests).toEqual([{ method: 'DELETE', url: '/api/workouts/3', headers: {}, body: undefined }]);
  });
});

describe('responses', () => {
  test('resolve to the parsed body', async () => {
    fetch.respondWith(200, '{"id":1,"sets":[]}');

    expect(await get<unknown>('/workouts/1')).toEqual({ id: 1, sets: [] });
  });

  test('resolve to null for an empty 2xx body', async () => {
    fetch.respondWith(200);

    expect(await get<unknown>('/workouts/1')).toBeNull();
  });
});

describe('failures', () => {
  test("reject with the server's error message, status and details", async () => {
    fetch.respondWith(400, '{"error":"Validation failed","details":{"reps":"must be positive"}}');

    const error = await rejection(post('/workouts/1/sets', { reps: -1 }));

    expect(error.message).toBe('Validation failed');
    expect(error.status).toBe(400);
    expect(error.details).toEqual({ reps: 'must be positive' });
  });

  test('reject with a generic message when the error body is not JSON, as from a proxy', async () => {
    fetch.respondWith(502, '<html>Bad Gateway</html>');

    const error = await rejection(get('/workouts'));

    expect(error.message).toBe('Request failed (502)');
    expect(error.status).toBe(502);
    expect(error.details).toBeUndefined();
  });

  test('reject with a generic message when the JSON error is not a string', async () => {
    fetch.respondWith(500, '{"error":{"code":1}}');

    expect((await rejection(get('/workouts'))).message).toBe('Request failed (500)');
  });

  test('reject with status 0 when the server cannot be reached, keeping the cause', async () => {
    const cause = new TypeError('Failed to fetch');
    fetch.failWith(cause);

    const error = await rejection(get('/workouts'));

    expect(error.message).toBe('Could not reach the cena server');
    expect(error.status).toBe(0);
    expect(error.details).toBe(cause);
  });
});

describe('a 401', () => {
  async function unauthorizedEvents(run: () => Promise<unknown>): Promise<number> {
    let heard = 0;
    const listener = (): void => {
      heard++;
    };
    globalThis.addEventListener(UNAUTHORIZED_EVENT, listener);
    try {
      await run();
    } finally {
      globalThis.removeEventListener(UNAUTHORIZED_EVENT, listener);
    }
    return heard;
  }

  test('dispatches the unauthorized event once and still rejects', async () => {
    fetch.respondWith(401, '{"error":"Not logged in"}');

    let error: ApiError | undefined;
    const heard = await unauthorizedEvents(async () => {
      error = await rejection(get('/workouts'));
    });

    expect(heard).toBe(1);
    expect(error?.status).toBe(401);
  });

  test('another failure dispatches nothing', async () => {
    fetch.respondWith(404, '{"error":"Workout not found"}');

    expect(await unauthorizedEvents(() => rejection(get('/workouts/9')))).toBe(0);
  });
});
