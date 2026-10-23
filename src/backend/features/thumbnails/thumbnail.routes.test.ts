import { describe, expect, test } from 'bun:test';
import { copyFileSync } from 'node:fs';
import { join } from 'node:path';
import { useServer } from '../../testing.ts';

const { api, configDir } = useServer();

const PNG = join(import.meta.dir, '1x1.png');

function place(name: string): void {
  copyFileSync(PNG, join(configDir(), 'thumbnails', name));
}

describe('GET /thumbnails/*', () => {
  test('serves a stored image with its type and an ETag', async () => {
    place('Gemüsereis.png');
    const res = await api(`/thumbnails/${encodeURIComponent('Gemüsereis.png')}`);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('image/png');
    expect(res.headers.get('etag')).toMatch(/^"[\da-z]+-[\da-z]+"$/);
    expect(new Uint8Array(await res.arrayBuffer())).toEqual(new Uint8Array(await Bun.file(PNG).arrayBuffer()));
  });

  test('answers a matching If-None-Match with 304', async () => {
    place('a.png');
    const etag = (await api('/thumbnails/a.png')).headers.get('etag') ?? '';
    const res = await api('/thumbnails/a.png', { headers: { 'If-None-Match': `W/${etag}` } });
    expect(res.status).toBe(304);
    expect(await res.text()).toBe('');
  });

  test('answers HEAD without a body', async () => {
    place('a.png');
    const res = await api('/thumbnails/a.png', { method: 'HEAD' });
    expect(res.status).toBe(200);
    expect(res.headers.get('content-length')).toBe(String(Bun.file(PNG).size));
  });

  test('answers a missing image with 404', async () => {
    expect((await api('/thumbnails/missing.png')).status).toBe(404);
  });

  test.each(['/thumbnails/..%2Fdata.db', '/thumbnails/%2e%2e%5Cdata.db', '/thumbnails/sub/a.png', '/thumbnails/', '/thumbnails/%E0%A4%A'])(
    'keeps %s inside the thumbnail directory',
    async (path) => {
      place('a.png');
      expect((await api(path)).status).toBe(404);
    },
  );

  test('locks the image down with the API policy, so an SVG cannot run scripts', async () => {
    place('a.png');
    expect((await api('/thumbnails/a.png')).headers.get('content-security-policy')).toBe("default-src 'none'; frame-ancestors 'none'");
  });
});
