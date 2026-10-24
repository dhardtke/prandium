import { beforeAll, describe, expect, test } from 'bun:test';
import { unlink } from 'node:fs/promises';
import { resolve } from 'node:path';
import { useLogs } from '../../../testing.ts';
import { bundleFrontend } from './bundle.ts';
import { FRONTEND_DIR } from './paths.ts';

describe('the frontend bundle', () => {
  let bundle = '';

  beforeAll(async () => {
    ({ code: bundle } = await bundleFrontend());
  });

  test("rewrites every import.meta.url to its module's own path", () => {
    // Not only `.url`: the rewrite is textual, so any `import.meta` left would be one it missed.
    expect(bundle).not.toContain('import.meta');
    expect(bundle).toContain('"/app/ce-app.component.ts"');
    expect(bundle).toContain('"/app/ce-header.component.ts"');
  });

  test('carries every component stylesheet and the base sheets', async () => {
    const urls = ['/vendor/oat.css', '/ui/shared.css'];
    for await (const entry of new Bun.Glob('**/*.component.css').scan({ cwd: FRONTEND_DIR })) {
      urls.push(`/${entry.replaceAll('\\', '/')}`);
    }
    expect(urls).toContain('/ui/pagination/ce-pagination.component.css');
    for (const url of urls) {
      expect({ url, carried: bundle.includes(`"${url}"`) }).toEqual({ url, carried: true });
    }
  });

  test("carries Oat's script ahead of the shell", () => {
    const oat = bundle.indexOf('"ot-dropdown"');
    expect(oat).toBeGreaterThan(-1);
    expect(oat).toBeLessThan(bundle.indexOf('"ce-app"'));
  });
});

describe('a module that does not parse', () => {
  const logs = useLogs();

  test('fails the bundle, naming the file', async () => {
    // Its own name, so it cannot race transpile.test.ts's `__broken.ts` under --parallel.
    const broken = resolve(FRONTEND_DIR, '__broken-bundle.ts');
    await Bun.write(broken, 'export const oops: = ;\n');
    try {
      const failure = await bundleFrontend(broken).then(
        () => null,
        (err: unknown) => err,
      );
      expect(failure).toBeInstanceOf(Error);
      expect(String(failure)).toMatch(/src\/frontend\/__broken-bundle\.ts:1:\d+: /);
      const lines = logs().filter((entry) => entry.text.startsWith('static could not bundle '));
      expect(lines).toHaveLength(1);
      expect(lines[0]?.level).toBe('error');
      expect(lines[0]?.text).toMatch(/^static could not bundle src\/frontend\/__broken-bundle\.ts:1:\d+: Unexpected =$/);
    } finally {
      await unlink(broken);
    }
  });
});
