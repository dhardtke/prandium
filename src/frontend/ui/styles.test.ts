import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { useDom } from '../testing.ts';
import type * as Styles from './styles.ts';

useDom();

describe('styles under an import map', () => {
  const requests: { url: string; cache: RequestCache | undefined }[] = [];
  let saved: typeof fetch;
  let styles: typeof Styles;

  beforeAll(async () => {
    saved = globalThis.fetch;
    globalThis.fetch = Object.assign(
      (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
        const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
        requests.push({ url, cache: init?.cache });
        return Promise.resolve(new Response('a {}'));
      },
      { preconnect: saved.preconnect },
    );
    const map = document.createElement('script');
    map.type = 'importmap';
    map.textContent = JSON.stringify({
      imports: {
        '/vendor/oat.css': '/vendor/oat.css?v=oat',
        '/ui/shared.css': '/ui/shared.css?v=shared',
        '/features/x/ce-x.component.css': '/features/x/ce-x.component.css?v=x',
      },
    });
    document.head.append(map);
    // A variable specifier: tsc resolves a literal one and knows no file with a query.
    const fresh = './styles.ts?import-map';
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- the same module, under a query
    styles = (await import(fresh)) as typeof Styles;
  });

  afterAll(() => {
    globalThis.fetch = saved;
    document.head.querySelector('script[type="importmap"]')?.remove();
  });

  test('fetches Oat and the shared utilities by the versions the map names', () => {
    expect(requests.slice(0, 2)).toEqual([
      { url: '/vendor/oat.css?v=oat', cache: undefined },
      { url: '/ui/shared.css?v=shared', cache: undefined },
    ]);
  });

  test("fetches a component's own sheet by its version, whatever version its module was loaded at", async () => {
    await styles.loadStyles('ce-x', 'http://localhost/features/x/ce-x.component.ts?v=module');
    expect(requests.at(-1)).toEqual({ url: '/features/x/ce-x.component.css?v=x', cache: undefined });
  });

  test('a sheet the map does not name is fetched at its plain URL', async () => {
    await styles.loadStyles('ce-y', 'http://localhost/features/y/ce-y.component.ts');
    expect(requests.at(-1)).toEqual({ url: '/features/y/ce-y.component.css', cache: undefined });
  });

  test('a hot reload revalidates, since the version may be cached for good though the file changed', async () => {
    expect(await styles.reloadSheet('/features/x/ce-x.component.css')).toBe(true);
    expect(requests.at(-1)).toEqual({ url: '/features/x/ce-x.component.css?v=x', cache: 'no-cache' });
  });
});
