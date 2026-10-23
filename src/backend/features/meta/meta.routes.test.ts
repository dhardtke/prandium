import { describe, expect, test } from 'bun:test';
import type { ErrorDto } from '../../../shared/dto/error.ts';
import { body, useServer } from '../../testing.ts';

const { api, post } = useServer();

describe('health and routing', () => {
  test('health endpoint responds', async () => {
    const res = await api('/api/health');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: 'ok', app: 'prandium', auth: false });
  });

  test('unknown api endpoint returns a JSON 404', async () => {
    const res = await api('/api/nope');
    expect(res.status).toBe(404);
    expect((await body<ErrorDto>(res)).error).toContain('not found');
  });

  test('the bare /api prefix returns a JSON 404, but /apix does not', async () => {
    const res = await api('/api');
    expect(res.status).toBe(404);
    expect((await body<ErrorDto>(res)).error).toContain('not found');
    // Every verb, not just GET: the key claims the URL before the static method gate.
    expect((await api('/api', { method: 'POST' })).status).toBe(404);
    expect((await api('/apix')).headers.get('content-type')).toContain('text/html');
  });
});

describe('with auth off', () => {
  test('the page says so, for every route', async () => {
    for (const path of ['/', '/recipes/1']) {
      expect(await (await api(path)).text()).toContain('<script type="application/json" id="auth-status">{"enabled":false}</script>');
    }
  });

  test('login lets any non-empty password in without setting a cookie', async () => {
    const res = await post('/api/auth/login', { password: 'anything' });
    expect(res.status).toBe(204);
    expect(res.headers.get('set-cookie')).toBeNull();
  });

  test('login still validates the body first', async () => {
    expect((await post('/api/auth/login', {})).status).toBe(400);
  });
});
