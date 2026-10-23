import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import type { Server } from 'bun';
import type { ErrorDto } from '../../shared/dto/error.ts';
import { body, type LogLine, useLogs, useServer } from '../testing.ts';
import { accessLog } from './access-log.ts';

describe('the access log', () => {
  const { api, post, logs } = useServer();

  function http(): LogLine[] {
    return logs().filter((line) => line.text.startsWith('http '));
  }

  function only(): LogLine {
    const lines = http();
    expect(lines).toHaveLength(1);
    return lines[0] ?? { level: 'info', text: '' };
  }

  test('logs a GET with its status and duration at info', async () => {
    expect((await api('/api/health')).status).toBe(200);
    const line = only();
    expect(line.level).toBe('info');
    expect(line.text).toMatch(/^http GET \/api\/health 200 \d+ms$/);
  });

  test('keeps the query string', async () => {
    await api('/api/health?limit=5&offset=0');
    expect(only().text).toMatch(/^http GET \/api\/health\?limit=5&offset=0 200 \d+ms$/);
  });

  test('appends the JSON body of a write', async () => {
    await post('/api/auth/login', { name: 'Squat', password: 'x' });
    expect(only().text).toMatch(/^http POST \/api\/auth\/login 204 \d+ms \{"name":"Squat","password":"\[redacted\]"\}$/);
  });

  test('logs a refused write at info, with its status and body', async () => {
    expect((await post('/api/auth/login', { name: '' })).status).toBe(400);
    const line = only();
    expect(line.level).toBe('info');
    expect(line.text).toMatch(/^http POST \/api\/auth\/login 400 \d+ms \{"name":""\}$/);
  });

  test('adds nothing for a write without a body', async () => {
    expect((await api('/api/auth/logout', { method: 'POST' })).status).toBe(204);
    expect(only().text).toMatch(/^http POST \/api\/auth\/logout 204 \d+ms$/);
  });

  test('redacts the password of a login', async () => {
    await post('/api/auth/login', { password: 'hunter2' });
    const line = only();
    expect(line.text).toMatch(/^http POST \/api\/auth\/login 204 \d+ms \{"password":"\[redacted\]"\}$/);
    expect(line.text).not.toContain('hunter2');
  });

  test('redacts a password at any depth', async () => {
    await post('/api/auth/login', { name: 'Row', nested: [{ password: 'hunter2', keep: 1 }] });
    const line = only();
    expect(line.text).toEndWith(' {"name":"Row","nested":[{"password":"[redacted]","keep":1}]}');
    expect(line.text).not.toContain('hunter2');
  });

  test('shows only the size of a body that is not JSON', async () => {
    const res = await api('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: 'password=hunter2' });
    expect(res.status).toBe(400);
    const line = only();
    expect(line.text).toMatch(/^http POST \/api\/auth\/login 400 \d+ms \[16 bytes, not JSON\]$/);
    expect(line.text).not.toContain('hunter2');
  });

  test('cuts a body longer than 1024 characters', async () => {
    await post('/api/auth/login', { name: 'Curl', filler: 'a'.repeat(2000) });
    const shown = JSON.stringify({ name: 'Curl', filler: 'a'.repeat(2000) });
    const text = only().text;
    expect(text).toEndWith(` ${shown.slice(0, 1024)}…(+${shown.length - 1024} more)`);
  });

  test('leaves the frontend out, a refused verb included', async () => {
    expect((await api('/')).status).toBe(200);
    expect((await api('/', { method: 'POST', body: 'x' })).status).toBe(405);
    expect(http()).toEqual([]);
  });

  test('logs an unknown /api endpoint at info', async () => {
    expect((await api('/api/nope')).status).toBe(404);
    const line = only();
    expect(line.level).toBe('info');
    expect(line.text).toMatch(/^http GET \/api\/nope 404 \d+ms$/);
  });
});

describe('the access log on a failing route', () => {
  const logs = useLogs();
  let server: Server<undefined>;

  beforeEach(() => {
    server = Bun.serve({
      port: 0,
      routes: accessLog({
        '/api/boom': () => {
          throw new Error('boom');
        },
        '/broken': () => new Response('x', { status: 500 }),
      }),
      // RouteTable allows upgrades, so Bun's types ask for a socket handler.
      websocket: { message: () => {} },
    });
  });

  afterEach(async () => {
    await server.stop(true);
  });

  test('answers a throw with a 500 and logs it with its stack', async () => {
    const res = await fetch(new URL('/api/boom', server.url));
    expect(res.status).toBe(500);
    expect(await body<ErrorDto>(res)).toEqual({ error: 'Internal server error' });
    expect(logs()).toHaveLength(1);
    const [line] = logs();
    expect(line?.level).toBe('error');
    expect(line?.text).toMatch(/^http GET \/api\/boom 500 \d+ms\n/);
    expect(line?.text).toContain('error: boom');
    expect(line?.text).toContain('access-log.test.ts');
  });

  test('logs a 500 outside /api at error, without a stack', async () => {
    expect((await fetch(new URL('/broken', server.url))).status).toBe(500);
    expect(logs()).toHaveLength(1);
    expect(logs()[0]?.level).toBe('error');
    expect(logs()[0]?.text).toMatch(/^http GET \/broken 500 \d+ms$/);
  });
});

test('refuses a static value', () => {
  expect(() => accessLog({ '/x': new Response('') })).toThrow('access log: /x is a static value and cannot be wrapped');
});
