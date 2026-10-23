// Rewrites `import.meta.url` per module, inlines every stylesheet and imports Oat's script.
import { relative, resolve } from 'node:path';
import type { BunPlugin } from 'bun';
import { log } from '../../../shared/log.ts';
import { FRONTEND_DIR, isShipped, resolveVendorPath, vendorUrls } from './paths.ts';

const INLINE_STYLES = resolve(FRONTEND_DIR, 'ui', 'inline-styles.ts');
const MAIN = resolve(FRONTEND_DIR, 'main.ts');

function urlOf(path: string): string {
  // Windows separators.
  return `/${relative(FRONTEND_DIR, path).replaceAll('\\', '/')}`;
}

function vendorPath(url: string): string {
  const path = resolveVendorPath(url);
  if (path === null) {
    throw new Error('Vendor file missing — run `bun install`');
  }
  return path;
}

async function inlineStyles(): Promise<Record<string, string>> {
  const styles: Record<string, string> = {};
  for await (const entry of new Bun.Glob('**/*.css').scan({ cwd: FRONTEND_DIR })) {
    const path = resolve(FRONTEND_DIR, entry);
    if (isShipped(urlOf(path))) {
      styles[urlOf(path)] = await Bun.file(path).text();
    }
  }
  for (const url of vendorUrls().filter((url) => url.endsWith('.css'))) {
    styles[url] = await Bun.file(vendorPath(url)).text();
  }
  return styles;
}

const frontend: BunPlugin = {
  name: 'prandium-frontend',
  setup(build) {
    build.onLoad({ filter: /\.ts$/ }, async ({ path }) => {
      if (resolve(path) === INLINE_STYLES) {
        return { contents: `export const INLINE_STYLES = ${JSON.stringify(await inlineStyles())};`, loader: 'ts' };
      }
      // Textual, so it would also rewrite one inside a string; bundle.test.ts checks none is left.
      const contents = (await Bun.file(path).text()).replaceAll('import.meta.url', JSON.stringify(urlOf(path)));
      // First, so Oat runs before any component, as its deferred script did.
      const oat = resolve(path) === MAIN ? `import ${JSON.stringify(vendorPath('/vendor/oat.js'))};\n` : '';
      return { contents: `${oat}${contents}`, loader: 'ts' };
    });
  },
};

function describeFailure(cause: unknown): string {
  const first: unknown = cause instanceof AggregateError ? cause.errors[0] : cause;
  if (first instanceof BuildMessage || first instanceof ResolveMessage) {
    const position = first.position;
    const where = position === null ? '' : `src/frontend${urlOf(position.file)}:${position.line}:${position.column}: `;
    return `${where}${first.message}`;
  }
  return String(first);
}

export interface FrontendBundle {
  code: string;
  map: string;
}

export async function bundleFrontend(entry = MAIN): Promise<FrontendBundle> {
  try {
    const result = await Bun.build({
      entrypoints: [entry],
      target: 'browser',
      format: 'esm',
      minify: true,
      sourcemap: 'linked',
      // The bundle is served at /main.ts, so its map comment must name /main.ts.map.
      naming: '[name].ts',
      plugins: [frontend],
    });
    const code = result.outputs.find((output) => output.kind === 'entry-point');
    const map = result.outputs.find((output) => output.kind === 'sourcemap');
    if (code === undefined || map === undefined) {
      // noinspection ExceptionCaughtLocallyJS
      throw new Error('Bun.build wrote no bundle or no source map');
    }
    return { code: await code.text(), map: await map.text() };
  } catch (cause) {
    const failure = describeFailure(cause);
    log.error('static', `could not bundle ${failure}`);
    throw new Error(`Could not bundle ${failure}`, { cause });
  }
}
