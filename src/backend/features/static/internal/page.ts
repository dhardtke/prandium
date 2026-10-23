// The import map versions what the page does not name: relative imports and component sheets.
import type { AuthStatusDto } from '../../../../shared/dto/auth.ts';

export interface PageSource {
  tags: () => Promise<Record<string, string>>;
}

function versioned(tags: Record<string, string>, url: string): string {
  const tag = tags[url];
  return tag === undefined ? url : `${url}?v=${tag}`;
}

/** Escapes `<`, so a `</script>` in a URL cannot end the script early. */
function scriptJson(value: unknown): string {
  return JSON.stringify(value).replaceAll('<', '\\u003c');
}

export async function embedAuthStatus(html: string | Uint8Array<ArrayBuffer>, status: AuthStatusDto): Promise<string> {
  return new HTMLRewriter()
    .on('head', {
      element: (el) => {
        el.append(`<script type="application/json" id="auth-status">${scriptJson(status)}</script>`, { html: true });
      },
    })
    .transform(new Response(html))
    .text();
}

/** A bundled page imports nothing by URL and fetches no sheet, so it needs no import map. */
export async function renderPage(html: string, source: PageSource, { importMap = true } = {}): Promise<string> {
  const tags = await source.tags();
  const imports = Object.fromEntries(Object.keys(tags).map((url) => [url, versioned(tags, url)]));
  let mapped = !importMap;
  return new HTMLRewriter()
    .on('script[src^="/"]', {
      element: (el) => {
        const src = el.getAttribute('src') ?? '';
        if (el.getAttribute('type') === 'module' && !mapped) {
          // The map must come before anything loads a module.
          el.before(`<script type="importmap">${scriptJson({ imports })}</script>\n    `, { html: true });
          mapped = true;
        }
        el.setAttribute('src', versioned(tags, src));
      },
    })
    .on('link[href^="/"]', {
      element: (el) => {
        el.setAttribute('href', versioned(tags, el.getAttribute('href') ?? ''));
      },
    })
    .transform(new Response(html))
    .text();
}
