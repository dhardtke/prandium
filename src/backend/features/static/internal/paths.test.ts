import { describe, expect, test } from 'bun:test';
import { existsSync } from 'node:fs';
import { join, sep } from 'node:path';
import { FRONTEND_DIR, resolveStaticPath } from './paths.ts';

describe('static paths', () => {
  // FRONTEND_DIR counts directories up; if this file moves, every asset silently 404s.
  test('FRONTEND_DIR points at the real src/frontend', () => {
    expect(FRONTEND_DIR.endsWith(join('src', 'frontend'))).toBe(true);
    expect(existsSync(join(FRONTEND_DIR, 'index.html'))).toBe(true);
  });

  test('a traversal attempt stays inside the web root', () => {
    // Normalizing collapses the `..` against the root rather than climbing out of it.
    const target = resolveStaticPath('/../backend/main.ts');
    expect(target).not.toBeNull();
    expect(target?.startsWith(FRONTEND_DIR + sep)).toBe(true);
  });

  test('refuses a path that cannot be a filename', () => {
    expect(resolveStaticPath('/a%00b')).toBeNull();
    expect(resolveStaticPath('/%zz')).toBeNull();
  });
});
