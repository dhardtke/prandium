import { describe, expect, test } from 'bun:test';
import { unlink } from 'node:fs/promises';
import { resolve } from 'node:path';
import { useServer } from '../../../testing.ts';

const { api } = useServer();

describe('typescript modules', () => {
  test('serves a .ts module as JavaScript with its types erased', async () => {
    const res = await api('/ui/format.ts');
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/javascript');

    const body = await res.text();
    expect(body).toContain('export function formatRelative(date, now');
    expect(body).not.toContain(': string');
    expect(body).not.toContain('| null | undefined');
  });

  test('leaves import specifiers alone, so a URL names a real file', async () => {
    const body = await (await api('/ui/pagination/ce-pagination.component.ts')).text();
    expect(body).toContain('from "../i18n.ts"');
  });

  test('serves the entry point index.html names', async () => {
    const page = await (await api('/')).text();
    expect(page).toMatch(/src="\/main\.ts\?v=\w+"/);

    const res = await api('/main.ts');
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/javascript');
    expect(await res.text()).toContain('./app/ce-app.component.ts');
  });

  test('strips type-only imports, so src/shared/ is never fetched at runtime', async () => {
    const body = await (await api('/features/auth/ce-login.component.ts')).text();
    // `src/shared/` is outside the web root: a surviving specifier would 404.
    expect(body).not.toContain('shared/dto');
  });

  test('keeps the load-bearing top-level await that pairs a module with its CSS', async () => {
    const body = await (await api('/ui/pagination/ce-pagination.component.ts')).text();
    expect(body).toContain('await define("ce-pagination"');
  });

  test('reports a module that will not parse', async () => {
    const broken = resolve(import.meta.dir, '..', '..', '..', '..', 'frontend', '__broken.ts');
    await Bun.write(broken, 'export const oops: = ;\n');
    try {
      const res = await api('/__broken.ts');
      expect(res.status).toBe(500);
      expect(res.headers.get('etag')).toBeNull();
      expect(await res.text()).toContain('__broken.ts');
    } finally {
      await unlink(broken);
    }
  });

  test('answers a module revalidation with 304', async () => {
    const etag = (await api('/ui/format.ts')).headers.get('etag') ?? '';
    const res = await api('/ui/format.ts', { headers: { 'If-None-Match': etag } });
    expect(res.status).toBe(304);
    expect(await res.text()).toBe('');
  });

  test('changes a module tag when its source changes', async () => {
    const module = resolve(import.meta.dir, '..', '..', '..', '..', 'frontend', '__etag.ts');
    await Bun.write(module, 'export const a = 1;\n');
    try {
      const before = (await api('/__etag.ts')).headers.get('etag');
      await Bun.write(module, 'export const b = 2;\n');
      const after = (await api('/__etag.ts')).headers.get('etag');
      expect(after).not.toBeNull();
      expect(after).not.toBe(before);
    } finally {
      await unlink(module);
    }
  });
});
