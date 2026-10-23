import { describe, expect, test } from 'bun:test';
import type { ErrorDto } from '../../shared/dto/error.ts';
import { HttpError, errorResponse } from './errors.ts';
import { body, useLogs } from '../testing.ts';

describe('errorResponse', () => {
  const logs = useLogs();

  test('renders an HttpError with its status, message and details', async () => {
    const res = errorResponse(new HttpError(400, 'bad input', { field: 'name' }));
    expect(res.status).toBe(400);
    expect(await body<ErrorDto>(res)).toEqual({ error: 'bad input', details: { field: 'name' } });
  });

  test('renders anything else as a 500, without logging it', async () => {
    const res = errorResponse(new Error('boom'));
    expect(res.status).toBe(500);
    expect(await body<ErrorDto>(res)).toEqual({ error: 'Internal server error' });
    expect(logs()).toEqual([]);
  });
});
