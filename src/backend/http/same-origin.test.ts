import { describe, expect, test } from 'bun:test';
import type { ErrorDto } from '../../shared/dto/error.ts';
import { body, useServer } from '../testing.ts';

const { api } = useServer();

function logIn(site?: string): Promise<Response> {
  return api('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(site === undefined ? {} : { 'Sec-Fetch-Site': site }) },
    body: '{"password":"hunter2"}',
  });
}

describe('cross-site writes', () => {
  test.each(['cross-site', 'same-site'])('refuses a write from %s', async (site) => {
    const res = await logIn(site);
    expect(res.status).toBe(403);
    expect(await body<ErrorDto>(res)).toEqual({ error: 'Cross-site request refused' });
  });

  test('refuses a cross-site logout, which carries no body', async () => {
    expect((await api('/api/auth/logout', { method: 'POST', headers: { 'Sec-Fetch-Site': 'cross-site' } })).status).toBe(403);
  });

  test.each(['same-origin', 'none', undefined])('lets a write through from %p', async (site) => {
    expect((await logIn(site)).status).toBe(204);
  });

  test('lets a cross-site read through', async () => {
    expect((await api('/api/health', { headers: { 'Sec-Fetch-Site': 'cross-site' } })).status).toBe(200);
  });
});
