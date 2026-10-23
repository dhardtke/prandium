import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import type { Embedded } from '../backend/shared/embedded.ts';
import { body, opens, waitForUrl } from '../backend/testing.ts';
import { build } from './build.ts';

const FRONTEND = resolve(import.meta.dir, '..', 'frontend');

type Server = Bun.Subprocess<'ignore', 'pipe', 'pipe'>;

function spawnBuilt(script: string, cwd: string, env: Record<string, string>): Server {
  return Bun.spawn([process.execPath, script], { cwd, env: { ...process.env, PORT: '0', ...env }, stdout: 'pipe', stderr: 'pipe' });
}

async function stopBuilt(proc: Server | undefined, dir: string): Promise<void> {
  if (proc) {
    proc.kill();
    await proc.exited;
  }
  rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 20 });
}

describe('single-file build', () => {
  let dir = '';
  let embedded: Embedded;
  let proc: Server | undefined;
  let origin = '';
  let stdout = '';

  beforeAll(async () => {
    dir = mkdtempSync(join(tmpdir(), 'prandium-build-'));
    ({ embedded } = await build(join(dir, 'out')));

    const deploy = join(dir, 'deploy');
    mkdirSync(deploy);
    copyFileSync(join(dir, 'out', 'prandium.js'), join(deploy, 'prandium.js'));

    proc = spawnBuilt('prandium.js', deploy, { PRANDIUM_CONFIG_DIR: join(deploy, 'config'), PRANDIUM_DEV: '1' });
    const started = await waitForUrl(proc.stdout, () => new Response(proc?.stderr).text());
    origin = new URL(started.url).origin;
    stdout = started.stdout;
  }, 60_000);

  afterAll(() => stopBuilt(proc, dir));

  function get(path: string, init?: RequestInit): Promise<Response> {
    return fetch(`${origin}${path}`, init);
  }

  test('serves the index page without the hot-reload client, whatever PRANDIUM_DEV says', async () => {
    for (const path of ['/', '/recipes/3']) {
      const res = await get(path);
      expect(res.status).toBe(200);
      const text = await res.text();
      expect(text).toContain('<!doctype html>');
      expect(text).not.toContain('/dev/hot.ts');
    }
    expect(stdout).not.toContain('hot reload: on');
  });

  test('stamps the index page with the commit, the build time in UTC and any workflow run ID', async () => {
    const head = Bun.spawnSync(['git', 'rev-parse', 'HEAD']).stdout.toString().trim();
    const text = await (await get('/')).text();
    const stamp = /^<!doctype html>\r?\n<!-- prandium ([0-9a-f]{40})(?:-dirty)?, built (\S+Z)(?:, run (\d+))? -->\r?\n/.exec(text);
    expect(stamp?.[1]).toBe(head);
    expect(Math.abs(Date.now() - Date.parse(stamp?.[2] ?? ''))).toBeLessThan(120_000);
    expect(stamp?.[3]).toBe(Bun.env.GITHUB_RUN_ID);
  });

  test('never opens a socket at /dev/ws', async () => {
    const socket = new WebSocket(`${origin.replace(/^http/, 'ws')}/dev/ws`);
    expect(await opens(socket)).toBe(false);
    socket.close();
  });

  test('serves the frontend as one minified bundle at /main.ts, and no other module', async () => {
    const main = await get('/main.ts');
    expect(main.headers.get('content-type')).toStartWith('text/javascript');
    const bundle = await main.text();
    expect(bundle).toBe(embedded.pages['/main.ts']?.body ?? '');
    expect(bundle).toContain('customElements.define');
    expect(bundle).toContain('"/features/recipes/internal/pr-rating.component.ts"');
    expect(bundle).not.toContain(': string');
    expect(bundle).not.toContain('PrDashboardComponent');
    expect(bundle).not.toContain('import.meta');

    for (const url of ['/app/pr-app.component.ts', '/ui/format.ts', '/ui/inline-styles.ts', '/ui/chart/pr-chart.component.ts']) {
      expect({ url, status: (await get(url)).status }).toEqual({ url, status: 404 });
    }
  });

  test('links one stylesheet and one script, by versions it serves for good', async () => {
    const page = await (await get('/')).text();
    const sheets = [...page.matchAll(/<link rel="stylesheet" href="([^"]+)"/g)].map((match) => match[1] ?? '');
    const scripts = [...page.matchAll(/<script[^>]* src="([^"]+)"/g)].map((match) => match[1] ?? '');
    expect(sheets).toHaveLength(1);
    expect(sheets[0]).toStartWith('/main.css?v=');
    expect(scripts).toHaveLength(1);
    expect(scripts[0]).toStartWith('/main.ts?v=');
    expect(page).not.toContain('rel="preload"');
    expect(page).not.toContain('rel="modulepreload"');
    expect(page).not.toContain('importmap');
    for (const url of [...sheets, ...scripts]) {
      const res = await get(url);
      expect({ url, status: res.status, cache: res.headers.get('cache-control') }).toEqual({ url, status: 200, cache: 'public, max-age=31536000, immutable' });
    }
  });

  test('joins Oat, the shared and the app stylesheet in that order', async () => {
    const res = await get('/main.css');
    expect(res.headers.get('content-type')).toStartWith('text/css');
    const paths = [Bun.resolveSync('@knadh/oat/oat.min.css', FRONTEND), join(FRONTEND, 'ui', 'shared.css'), join(FRONTEND, 'ui', 'app.css')];
    const parts = await Promise.all(paths.map((path) => Bun.file(path).text()));
    expect(await res.text()).toBe(parts.join('\n'));
  });

  test('serves no stylesheet or Oat file that the bundle and main.css already carry', async () => {
    const urls = ['/ui/app.css', '/ui/shared.css', '/vendor/oat.css', '/vendor/oat.js'];
    for await (const entry of new Bun.Glob('**/pr-*.component.ts').scan({ cwd: FRONTEND })) {
      urls.push(`/${entry.replaceAll('\\', '/').replace(/\.ts$/, '.css')}`);
    }
    expect(urls.length).toBeGreaterThan(4);
    for (const url of urls) {
      expect({ url, status: (await get(url)).status }).toEqual({ url, status: 404 });
    }
  });

  test('serves the manifest and the icons byte for byte as they are on disk', async () => {
    for (const url of ['/manifest.webmanifest', '/icons/icon.svg', '/icons/icon-192.png', '/icons/icon-maskable-512.png']) {
      const source = Bun.file(join(FRONTEND, url));
      const res = await get(url);
      expect({ url, status: res.status }).toEqual({ url, status: 200 });
      expect(res.headers.get('content-type')).toBe(source.type);
      expect(new Uint8Array(await res.arrayBuffer())).toEqual(await source.bytes());
    }
    expect(embedded.pages['/icons/icon-192.png']?.base64).toBe(true);
    expect(embedded.pages['/index.html']?.base64).toBeUndefined();
  });

  test('carries neither the dev client nor anything test-only', async () => {
    expect(await Bun.file(join(FRONTEND, 'features', 'recipes', 'recipes.fixtures.ts')).exists()).toBe(true);
    for (const url of [
      '/dev/hot.ts',
      '/testing.ts',
      '/ui/html.test.ts',
      '/ui/pagination/pr-pagination.component.test.ts',
      '/features/recipes/recipes.fixtures.ts',
    ]) {
      expect({ url, status: (await get(url)).status }).toEqual({ url, status: 404 });
    }
  });

  test('keeps the path guards', async () => {
    expect((await get('/ui/../main.ts')).status).toBe(200);
    for (const url of ['/%2e%2e/backend/http/server.ts', '/%zz', '/vendor/%6fat.css']) {
      expect({ url, status: (await get(url)).status }).toEqual({ url, status: 404 });
    }
  });

  test('ran the embedded migrations into data.db in PRANDIUM_CONFIG_DIR, beside thumbnails/', async () => {
    expect(await body<unknown>(await get('/api/health'))).toMatchObject({ status: 'ok' });
    expect((await get('/api/recipes')).status).toBe(200);
    expect(existsSync(join(dir, 'deploy', 'config', 'data.db'))).toBe(true);
    expect(existsSync(join(dir, 'deploy', 'config', 'thumbnails'))).toBe(true);
  });

  test('answers a revalidation with 304', async () => {
    const etag = (await get('/main.ts')).headers.get('etag') ?? '';
    expect(etag).not.toBe('');
    expect((await get('/main.ts', { headers: { 'If-None-Match': etag } })).status).toBe(304);
  });

  test('refuses a verb it does not serve', async () => {
    expect((await get('/', { method: 'POST' })).status).toBe(405);
  });

  test('links a source map that points back at the sources', async () => {
    expect(readFileSync(join(dir, 'out', 'prandium.js'), 'utf8')).toContain('//# sourceMappingURL=prandium.js.map');
    const map = await body<{ sources: string[] }>(new Response(Bun.file(join(dir, 'out', 'prandium.js.map'))));
    expect(map.sources.some((source) => source.replaceAll('\\', '/').endsWith('src/backend/main.ts'))).toBe(true);
  });

  test("serves the bundle's source map, carrying the sources the build no longer serves", async () => {
    expect(await (await get('/main.ts')).text()).toEndWith('//# sourceMappingURL=main.ts.map\n');
    const res = await get('/main.ts.map');
    expect(res.headers.get('content-type')).toStartWith('application/json');
    const map = await body<{ sources: string[]; sourcesContent: string[] }>(res);
    const index = map.sources.findIndex((source) => source.endsWith('src/frontend/features/recipes/pr-recipe-list.component.ts'));
    expect(index).not.toBe(-1);
    expect(map.sourcesContent[index]).toContain('class PrRecipeListComponent');
  });

  test('names the Bun that built it, for the server to run it with', () => {
    expect(readFileSync(join(dir, 'out', 'bun-version'), 'utf8')).toBe(`${Bun.version}\n`);
  });
});

describe('single-file build with PRANDIUM_PASSWORD_HASH set', () => {
  let dir = '';
  let proc: Server | undefined;
  let origin = '';

  beforeAll(async () => {
    dir = mkdtempSync(join(tmpdir(), 'prandium-build-auth-'));
    await build(join(dir, 'out'));
    const hash = await Bun.password.hash('right', { algorithm: 'bcrypt', cost: 4 });
    proc = spawnBuilt(join(dir, 'out', 'prandium.js'), dir, { PRANDIUM_CONFIG_DIR: join(dir, 'config'), PRANDIUM_PASSWORD_HASH: hash });
    origin = new URL((await waitForUrl(proc.stdout, () => new Response(proc?.stderr).text())).url).origin;
  }, 60_000);

  afterAll(() => stopBuilt(proc, dir));

  test('guards the API and says so in the health check', async () => {
    expect((await fetch(`${origin}/api/recipes`)).status).toBe(401);
    expect(await body<unknown>(await fetch(`${origin}/api/health`))).toMatchObject({ auth: true });
  });
});
