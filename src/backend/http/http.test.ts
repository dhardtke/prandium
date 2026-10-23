import { describe, expect, test } from 'bun:test';
import { useServer } from '../testing.ts';
import { HttpError } from './errors.ts';
import { optionalQueryString, queryIds, readBytes } from './http.ts';
import { MAX_BODY_BYTES } from './server.ts';

const { api, post } = useServer();

describe('request bodies', () => {
  test('rejects malformed JSON', async () => {
    const res = await api('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{not json',
    });
    expect(res.status).toBe(400);
  });

  test('rejects a non-object body', async () => {
    const res = await post('/api/auth/login', ['hunter2']);
    expect(res.status).toBe(400);
  });

  test.each([[undefined], ['text/plain'], ['application/x-www-form-urlencoded']])('rejects a body sent as %p', async (type) => {
    const res = await api('/api/auth/login', {
      method: 'POST',
      headers: type === undefined ? {} : { 'Content-Type': type },
      body: '{"password":"hunter2"}',
    });
    expect(res.status).toBe(415);
  });

  test('accepts application/json with a charset', async () => {
    const res = await api('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'Application/JSON; charset=utf-8' },
      body: '{"password":"hunter2"}',
    });
    expect(res.status).toBe(204);
  });

  // Headers only: Bun refuses by Content-Length and closes, so a fetch still uploading would see a reset.
  test('refuses a body over the limit', async () => {
    const { hostname, port } = new URL(await api('/api/health').then((res) => res.url));
    const { promise, resolve } = Promise.withResolvers<string>();
    let response = '';
    const socket = await Bun.connect({
      hostname,
      port: Number(port),
      socket: {
        data: (_socket, chunk) => {
          response += chunk.toString();
          resolve(response);
        },
        close: () => {
          resolve(response);
        },
      },
    });
    socket.write(`POST /api/auth/login HTTP/1.1\r\nHost: ${hostname}\r\nContent-Type: application/json\r\nContent-Length: ${MAX_BODY_BYTES + 1}\r\n\r\n`);
    expect(await promise).toStartWith('HTTP/1.1 413');
    socket.end();
  });
});

describe('optionalQueryString', () => {
  test('reads and trims a value', () => {
    expect(optionalQueryString(new URLSearchParams('search=%20squat%20'), 'search', 120)).toBe('squat');
  });

  test.each(['', 'search=', 'search=%20%20'])('reads %p as null', (query) => {
    expect(optionalQueryString(new URLSearchParams(query), 'search', 120)).toBeNull();
  });

  test('rejects a value over the maximum length', () => {
    expect(() => optionalQueryString(new URLSearchParams({ search: 'a'.repeat(121) }), 'search', 120)).toThrow('"search" must be at most 120 characters');
  });
});

describe('queryIds', () => {
  test('reads every value of a repeated key, once each, in order', () => {
    expect(queryIds(new URLSearchParams('tag=3&tag=1&tag=3'), 'tag')).toEqual([3, 1]);
  });

  test.each(['', 'tag=', 'other=1'])('reads %p as no ids', (query) => {
    expect(queryIds(new URLSearchParams(query), 'tag')).toEqual([]);
  });

  test.each(['tag=0', 'tag=1.5', 'tag=x', 'tag=-2'])('rejects %p', (query) => {
    expect(() => queryIds(new URLSearchParams(query), 'tag')).toThrow('"tag" must hold only whole numbers of at least 1');
  });

  test('rejects more values than the maximum', () => {
    expect(() => queryIds(new URLSearchParams('tag=1&tag=2&tag=3'), 'tag', { max: 2 })).toThrow('"tag" may be given at most 2 times');
  });
});

describe('readBytes', () => {
  function status(read: Promise<unknown>): Promise<unknown> {
    return read.then(
      () => 'resolved',
      (error: unknown) => (error instanceof HttpError ? error.status : error),
    );
  }

  function request(type: string | null, body: Uint8Array<ArrayBuffer>): Request {
    return new Request('http://localhost/', { method: 'PUT', headers: type === null ? {} : { 'Content-Type': type }, body });
  }

  test('reads the bytes and the type of an allowed body', async () => {
    const read = await readBytes(request('Image/PNG; charset=binary', new Uint8Array([1, 2, 3])), { types: ['image/'], maxBytes: 10 });
    expect(read).toEqual({ bytes: new Uint8Array([1, 2, 3]), type: 'image/png' });
  });

  test.each([null, 'text/plain', 'application/json'])('refuses a body sent as %p with a 415', async (type) => {
    expect(await status(readBytes(request(type, new Uint8Array([1])), { types: ['image/'], maxBytes: 10 }))).toBe(415);
  });

  test('refuses an empty body', async () => {
    expect(await status(readBytes(request('image/png', new Uint8Array()), { types: ['image/'], maxBytes: 10 }))).toBe(400);
  });

  test('refuses a body over the maximum', async () => {
    expect(await status(readBytes(request('image/png', new Uint8Array(11)), { types: ['image/'], maxBytes: 10 }))).toBe(400);
  });
});
