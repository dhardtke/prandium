import { resolve } from 'node:path';
import type { EmbeddedFile, EmbeddedWeb } from '../../../shared/embedded.ts';
import { bundleFrontend } from './bundle.ts';
import { contentTag } from './content-tag.ts';
import { renderPage } from './page.ts';
import { FRONTEND_DIR, isShipped, isVersioned, resolveVendorPath } from './paths.ts';

const MODULE_TYPE = 'text/javascript;charset=utf-8';

function isText(type: string): boolean {
  const essence = type.split(';', 1)[0]?.trim() ?? '';
  return (
    essence.startsWith('text/') ||
    essence.endsWith('+json') ||
    essence.endsWith('+xml') ||
    essence === 'application/json' ||
    essence === 'application/javascript'
  );
}

const MAIN_CSS = '/main.css';

/** The bundle carries Oat's script and the sheets the preloads fetched, so one stylesheet is left to link. */
async function linkOneSheet(html: string): Promise<{ html: string; sheets: string[] }> {
  const sheets: string[] = [];
  const rewritten = await new HTMLRewriter()
    .on('link[rel="stylesheet"]', {
      element: (el) => {
        const href = el.getAttribute('href') ?? '';
        if (sheets.length === 0) {
          el.setAttribute('href', MAIN_CSS);
        } else {
          el.remove();
        }
        sheets.push(href);
      },
    })
    .on('link[rel="preload"][as="fetch"], script[src="/vendor/oat.js"]', {
      element: (el) => {
        el.remove();
      },
    })
    .on('head', {
      comments: (comment) => {
        comment.remove();
      },
    })
    .transform(new Response(html))
    .text();
  return { html: rewritten, sheets };
}

async function readSheet(url: string): Promise<string> {
  const file = Bun.file(resolveVendorPath(url) ?? resolve(FRONTEND_DIR, `.${url}`));
  if (!(await file.exists())) {
    throw new Error(`Stylesheet ${url} missing — run \`bun install\``);
  }
  return file.text();
}

export async function embedWebRoot(): Promise<EmbeddedWeb> {
  const pages: Record<string, EmbeddedFile> = {};
  for await (const entry of new Bun.Glob('**/*').scan({ cwd: FRONTEND_DIR })) {
    // Glob yields `ui\app.css` on Windows.
    const url = `/${entry.replaceAll('\\', '/')}`;
    // The modules and stylesheets ship inside the bundle and main.css below.
    if (!isShipped(url) || url.endsWith('.ts') || url.endsWith('.css')) {
      continue;
    }

    // Binary goes in as base64: `JSON.stringify` cannot carry raw bytes into prandium.js.
    const file = Bun.file(resolve(FRONTEND_DIR, entry));
    pages[url] = isText(file.type) ? { body: await file.text(), type: file.type } : { body: (await file.bytes()).toBase64(), type: file.type, base64: true };
  }
  const bundle = await bundleFrontend();
  pages['/main.ts'] = { body: bundle.code, type: MODULE_TYPE };
  pages['/main.ts.map'] = { body: bundle.map, type: 'application/json;charset=utf-8' };

  const index = pages['/index.html'];
  if (index !== undefined) {
    const { html, sheets } = await linkOneSheet(index.body);
    index.body = html;
    pages[MAIN_CSS] = { body: (await Promise.all(sheets.map(readSheet))).join('\n'), type: 'text/css;charset=utf-8' };
  }

  // Last, tagged from the strings EmbeddedWebFiles serves, so a version matches its ETag.
  const tags = Object.fromEntries(
    Object.entries(pages)
      .filter(([url]) => isVersioned(url))
      .map(([url, file]) => [url, contentTag(file.body)]),
  );
  for (const page of Object.values(pages)) {
    if (page.type.startsWith('text/html')) {
      page.body = await renderPage(page.body, { tags: () => Promise.resolve(tags) }, { importMap: false });
    }
  }

  return { pages };
}
