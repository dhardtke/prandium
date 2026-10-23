import { describe, expect, test } from 'bun:test';
import { unlink } from 'node:fs/promises';
import { resolve } from 'node:path';
import { useServer } from '../../testing.ts';
import { FRONTEND_DIR } from './internal/paths.ts';

const { api } = useServer();

describe('static files', () => {
  test('serves the frontend at the root', async () => {
    const res = await api('/');
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/html');
    const page = await res.text();
    expect(page).toContain('prandium');
    expect(page).not.toContain('/dev/hot.ts');
  });

  test('rejects directory traversal below src/frontend/', async () => {
    const res = await api('/../package.json');
    expect(res.status).toBe(404);
  });

  test('serves the app stylesheets', async () => {
    for (const path of ['/ui/app.css', '/ui/shared.css', '/app/pr-app.component.css']) {
      const res = await api(path);
      expect(res.status).toBe(200);
      expect(res.headers.get('content-type')).toContain('text/css');
    }
  });

  test('serves a stylesheet beside every component module', async () => {
    const modules = await Array.fromAsync(new Bun.Glob('**/pr-*.component.ts').scan(FRONTEND_DIR));
    expect(modules.length).toBeGreaterThanOrEqual(8);
    for (const file of modules) {
      // scan() yields backslashes on Windows.
      const res = await api(`/${file.replaceAll('\\', '/').replace(/\.ts$/, '.css')}`);
      expect(res.status).toBe(200);
      expect(res.headers.get('content-type')).toContain('text/css');
    }
  });

  test("serves Oat's stylesheet and script from node_modules at fixed vendor paths", async () => {
    const css = await api('/vendor/oat.css');
    expect(css.status).toBe(200);
    expect(css.headers.get('content-type')).toContain('text/css');
    expect(await css.text()).toContain('@layer theme,base,components');

    const js = await api('/vendor/oat.js');
    expect(js.status).toBe(200);
    expect(js.headers.get('content-type')).toContain('text/javascript');
    expect(await js.text()).toContain('customElements.define("ot-dropdown"');
  });

  test('exposes only the allowlisted vendor files, not node_modules', async () => {
    expect((await api('/vendor/oat.min.css')).status).toBe(404);
    expect((await api('/vendor/pico.css')).status).toBe(404);
    expect((await api('/node_modules/@knadh/oat/package.json')).status).toBe(404);
  });

  test('answers HEAD with the headers and no body', async () => {
    const res = await api('/ui/format.ts', { method: 'HEAD' });
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/javascript');
    expect(await res.text()).toBe('');
  });

  test('returns 404 for a .ts file that does not exist', async () => {
    expect((await api('/nope.ts')).status).toBe(404);
  });

  test('answers a verb other than GET or HEAD with 405', async () => {
    // `/vendor/oat.css` has its own { GET, HEAD } route, so its 405 can only come from `/*`.
    for (const path of ['/', '/ui/app.css', '/vendor/oat.css']) {
      const res = await api(path, { method: 'POST' });
      expect(res.status).toBe(405);
      expect(await res.text()).toBe('Method not allowed');
    }
  });

  test("lets the page show blob: images, the thumbnail upload's preview", async () => {
    const policy = (await api('/')).headers.get('content-security-policy') ?? '';
    expect(policy.split('; ')).toContain("img-src 'self' data: blob:");
  });

  test('serves the index page for an extension-less client route', async () => {
    const res = await api('/recipes/1');
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/html');
  });

  test('a trailing-slash directory with no index is a 404, but the path without one is not', async () => {
    for (const path of ['/ui/', '/app/']) {
      expect((await api(path)).status).toBe(404);
    }
    // No trailing slash: still an extension-less client route for the single-page app.
    const res = await api('/ui');
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/html');
  });

  test('refuses to transpile anything outside src/frontend/', async () => {
    // Encoded, so the URL parser cannot normalize the traversal away.
    expect((await api('/%2e%2e/backend/http/server.ts')).status).toBe(404);
    expect((await api('/%2e%2e/backend/features/static/internal/transpile.ts')).status).toBe(404);
  });
});

describe('installable app', () => {
  interface ManifestIcon {
    src: string;
    sizes: string;
    type: string;
    purpose: string;
  }
  interface Manifest {
    id: string;
    name: string;
    short_name: string;
    start_url: string;
    scope: string;
    display: string;
    theme_color: string;
    background_color: string;
    icons: ManifestIcon[];
  }

  const manifest = async (): Promise<Manifest> => {
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- the shape is what the tests check
    return (await (await api('/manifest.webmanifest')).json()) as Manifest;
  };

  /** A PNG's real size, from its IHDR chunk: big-endian width and height at bytes 16 and 20. */
  const pngSize = async (src: string): Promise<string> => {
    const view = new DataView(await (await api(src)).arrayBuffer());
    return `${view.getUint32(16)}x${view.getUint32(20)}`;
  };

  test('serves the manifest as application/manifest+json, revalidated like every file', async () => {
    const res = await api('/manifest.webmanifest');
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toStartWith('application/manifest+json');
    expect(res.headers.get('etag')).toMatch(/^"[0-9a-z]+"$/);
    expect(res.headers.get('cache-control')).toBe('no-cache');

    const json = await manifest();
    expect(json).toMatchObject({ id: '/', start_url: '/', scope: '/', display: 'standalone' });
    expect(json.name).not.toBe('');
    expect(json.short_name).not.toBe('');
    expect(json.theme_color).toMatch(/^#/);
    expect(json.background_color).toMatch(/^#/);
  });

  test('serves every manifest icon with its declared type', async () => {
    const { icons } = await manifest();
    expect(icons.length).toBeGreaterThan(0);
    for (const icon of icons) {
      const res = await api(icon.src);
      expect({ src: icon.src, status: res.status }).toEqual({ src: icon.src, status: 200 });
      expect(res.headers.get('content-type')).toStartWith(icon.type);
    }
  });

  test('carries the raster icons an Android install needs, at their real sizes', async () => {
    const pngs = (await manifest()).icons.filter((icon) => icon.type === 'image/png');
    for (const icon of pngs) {
      expect({ src: icon.src, size: await pngSize(icon.src) }).toEqual({ src: icon.src, size: icon.sizes });
    }
    const has = (purpose: string, sizes: string): boolean => pngs.some((icon) => icon.purpose === purpose && icon.sizes === sizes);
    expect(has('any', '192x192')).toBe(true);
    expect(has('any', '512x512')).toBe(true);
    expect(has('maskable', '512x512')).toBe(true);
  });

  test('the index page links the manifest, the icon and a theme-color ahead of any script', async () => {
    const page = await (await api('/')).text();
    expect(page).toContain('<link rel="manifest" href="/manifest.webmanifest"');
    expect(page).toContain('<link rel="icon" href="/icons/icon.svg"');
    expect(page).not.toContain('data:image/svg+xml');

    const meta = page.indexOf('<meta name="theme-color"');
    expect(meta).toBeGreaterThan(-1);
    expect(meta).toBeLessThan(page.indexOf('<script'));
  });
});

const plain = (url: string): string => url.split('?', 1)[0] ?? url;
const hrefs = (page: string, pattern: RegExp): string[] => [...page.matchAll(pattern)].map((match) => match[1] ?? '');
const importMap = (page: string): Record<string, string> => {
  const json = /<script type="importmap">([^<]*)<\/script>/.exec(page)?.[1] ?? '{}';
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- the shape is what the tests check
  return (JSON.parse(json) as { imports: Record<string, string> }).imports;
};

describe('preloads', () => {
  const sheets = (page: string): string[] => hrefs(page, /<link rel="preload" href="([^"]+)" as="fetch" crossorigin \/>/g).map(plain);

  test('announce no module graph', async () => {
    const page = await (await api('/')).text();
    expect(page).not.toContain('rel="modulepreload"');
    expect(page).not.toContain('data-lazy-preloads');
  });

  test("the page's own preloads name stylesheets that exist", async () => {
    const page = await (await api('/')).text();
    expect(sheets(page)).toEqual(['/vendor/oat.css', '/ui/shared.css']);
    for (const url of sheets(page)) {
      const res = await api(url);
      expect({ url, status: res.status }).toEqual({ url, status: 200 });
      expect(res.headers.get('content-type')).toContain('text/css');
    }
  });
});

describe('versions', () => {
  const IMMUTABLE = 'public, max-age=31536000, immutable';

  test('the import map names every module, stylesheet and vendor file by its current tag', async () => {
    const imports = importMap(await (await api('/')).text());
    for (const url of ['/main.ts', '/ui/app.css', '/vendor/oat.css', '/vendor/oat.js', '/ui/pagination/pr-pagination.component.css']) {
      expect(imports).toHaveProperty([url]);
    }
    expect(Object.keys(imports).filter((url) => url.endsWith('.test.ts') || url.startsWith('/dev/') || url === '/testing.ts')).toEqual([]);
    for (const [url, versioned] of Object.entries(imports)) {
      const etag = (await api(url)).headers.get('etag') ?? '';
      expect(versioned).toBe(`${url}?v=${etag.replaceAll('"', '')}`);
    }
  });

  test("a version is served for good, under the same tag as the plain URL's", async () => {
    const imports = importMap(await (await api('/')).text());
    for (const url of ['/main.ts', '/ui/app.css', '/vendor/oat.css', '/vendor/oat.js']) {
      const res = await api(imports[url] ?? '');
      expect({ url, cache: res.headers.get('cache-control') }).toEqual({ url, cache: IMMUTABLE });
      expect(res.headers.get('etag')).toBe((await api(url)).headers.get('etag'));
    }
  });

  test('a version that is not the current one is revalidated, as a plain URL is', async () => {
    for (const url of ['/main.ts?v=stale', '/ui/app.css?v=', '/vendor/oat.css?v=stale', '/ui/app.css?hot=1']) {
      const res = await api(url);
      expect(res.status).toBe(200);
      expect({ url, cache: res.headers.get('cache-control') }).toEqual({ url, cache: 'no-cache' });
    }
  });

  test('a revalidated version keeps its for-good caching on the 304', async () => {
    const versioned = importMap(await (await api('/')).text())['/ui/app.css'] ?? '';
    const etag = (await api(versioned)).headers.get('etag') ?? '';
    const res = await api(versioned, { headers: { 'If-None-Match': etag } });
    expect(res.status).toBe(304);
    expect(res.headers.get('cache-control')).toBe(IMMUTABLE);
  });

  test("the page names its own files by those versions, all but the icon's and the manifest's", async () => {
    const page = await (await api('/recipes/1')).text();
    const imports = importMap(page);
    const named = [...hrefs(page, /<link [^>]*href="([^"]+)"/g), ...hrefs(page, /<script [^>]*src="([^"]+)"/g)];
    expect(named).toContain('/icons/icon.svg');
    expect(named).toContain('/manifest.webmanifest');
    for (const url of named.filter((url) => url !== '/icons/icon.svg' && url !== '/manifest.webmanifest')) {
      expect(url).toBe(imports[plain(url)] ?? 'unmapped');
    }
  });

  test('the import map comes before anything that loads a module', async () => {
    const page = await (await api('/')).text();
    const map = page.indexOf('<script type="importmap">');
    expect(map).toBeGreaterThan(-1);
    expect(map).toBeLessThan(page.indexOf('<script type="module"'));
  });

  test('editing a file changes its version in the next page', async () => {
    const path = resolve(FRONTEND_DIR, '__version.css');
    await Bun.write(path, 'a { color: red; }\n');
    try {
      const before = importMap(await (await api('/')).text())['/__version.css'];
      await Bun.write(path, 'a { color: blue; }\n');
      const after = importMap(await (await api('/')).text())['/__version.css'];
      expect(before).toStartWith('/__version.css?v=');
      expect(after).toStartWith('/__version.css?v=');
      expect(after).not.toBe(before);
    } finally {
      await unlink(path);
    }
  });
});

describe('revalidation', () => {
  const tagOf = async (path: string): Promise<string> => {
    const res = await api(path);
    expect(res.status).toBe(200);
    return res.headers.get('etag') ?? '';
  };

  test('every served file carries a strong ETag and no-cache', async () => {
    for (const path of ['/', '/recipes/1', '/ui/app.css', '/vendor/oat.css', '/vendor/oat.js', '/main.ts']) {
      const res = await api(path);
      expect(res.status).toBe(200);
      expect(res.headers.get('etag')).toMatch(/^"[0-9a-z]+"$/);
      expect(res.headers.get('cache-control')).toBe('no-cache');
    }
  });

  test('the root and a client route share the index page tag', async () => {
    expect(await tagOf('/recipes/1')).toBe(await tagOf('/'));
  });

  test('a matching If-None-Match gets an empty 304', async () => {
    for (const path of ['/ui/app.css', '/vendor/oat.css', '/vendor/oat.js', '/recipes/1']) {
      const etag = await tagOf(path);
      for (const method of ['GET', 'HEAD']) {
        const res = await api(path, { method, headers: { 'If-None-Match': etag } });
        expect(res.status).toBe(304);
        expect(await res.text()).toBe('');
        expect(res.headers.get('etag')).toBe(etag);
        expect(res.headers.get('cache-control')).toBe('no-cache');
      }
    }
  });

  test('a list, a weak tag and * all match', async () => {
    const etag = await tagOf('/ui/app.css');
    for (const header of [`"stale", ${etag}`, `W/${etag}`, '*']) {
      const res = await api('/ui/app.css', { headers: { 'If-None-Match': header } });
      expect(res.status).toBe(304);
    }
  });

  test('a stale tag gets the full body', async () => {
    const res = await api('/ui/app.css', { headers: { 'If-None-Match': '"stale"' } });
    expect(res.status).toBe(200);
    expect((await res.text()).length).toBeGreaterThan(0);
  });

  test('editing a file changes its tag', async () => {
    const path = resolve(FRONTEND_DIR, '__etag.css');
    await Bun.write(path, 'a { color: red; }\n');
    try {
      const before = await tagOf('/__etag.css');
      await Bun.write(path, 'a { color: blue; }\n');
      const res = await api('/__etag.css', { headers: { 'If-None-Match': before } });
      expect(res.status).toBe(200);
      expect(res.headers.get('etag')).not.toBe(before);
    } finally {
      await unlink(path);
    }
  });

  test('error responses carry no ETag', async () => {
    for (const res of [await api('/nope.css'), await api('/vendor/oat.scss'), await api('/', { method: 'POST' })]) {
      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.headers.get('etag')).toBeNull();
    }
  });
});
