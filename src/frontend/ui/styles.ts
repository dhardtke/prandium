import { INLINE_STYLES } from './inline-styles.ts';

const BASE_HREFS = ['/vendor/oat.css', '/ui/shared.css'];

const sheets = new Map<string, CSSStyleSheet>();

const hrefs = new Map<string, string>();

const pending = new Map<string, Promise<void>>();

let importMap: Record<string, string> | undefined;

// Not import.meta.resolve(): bun test resolves it against the file system.
function versioned(href: string): string {
  if (importMap === undefined) {
    importMap = {};
    const script = document.querySelector('script[type="importmap"]');
    try {
      // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- written by the server's page.ts
      importMap = (JSON.parse(script?.textContent ?? '{}') as { imports?: Record<string, string> }).imports ?? {};
    } catch (cause) {
      console.error('cena: could not read the import map', cause);
    }
  }
  return importMap[href] ?? href;
}

// A refill revalidates: the versioned URL may be cached for good while the file changed on disk.
async function load(href: string, refill = false): Promise<void> {
  const sheet = sheets.get(href) ?? new CSSStyleSheet();
  sheets.set(href, sheet);
  const inline = INLINE_STYLES[href];
  if (inline !== undefined) {
    await sheet.replace(inline);
    return;
  }
  try {
    const response = await fetch(versioned(href), refill ? { cache: 'no-cache' } : undefined);
    if (!response.ok) {
      // noinspection ExceptionCaughtLocallyJS
      throw new Error(`HTTP ${response.status}`);
    }

    // replace() rather than replaceSync(): it tolerates @import instead of throwing.
    await sheet.replace(await response.text());
  } catch (cause) {
    // An unstyled component is easier to diagnose than a blank page.
    console.error(`cena: could not load stylesheet ${href}`, cause);
    await sheet.replace('');
  }
}

await Promise.all(BASE_HREFS.map((href) => load(href)));

export function loadStyles(tagName: string, moduleUrl: string): Promise<void> {
  // A pathname, like BASE_HREFS and the paths dev/hot.ts receives, so hot swaps find the sheet.
  const href = new URL(moduleUrl, location.href).pathname.replace(/\.ts$/, '.css');
  hrefs.set(tagName, href);
  let promise = pending.get(href);
  if (!promise) {
    promise = load(href);
    pending.set(href, promise);
  }
  return promise;
}

// Synchronous for constructors; safe because define() awaits loadStyles before registering.
export function stylesFor(tagName: string): CSSStyleSheet[] {
  const href = hrefs.get(tagName);
  const own = href === undefined ? undefined : sheets.get(href);
  const base = BASE_HREFS.flatMap((href) => {
    const sheet = sheets.get(href);
    return sheet ? [sheet] : [];
  });
  return own ? [...base, own] : base;
}

export async function reloadSheet(href: string): Promise<boolean> {
  if (!sheets.has(href)) {
    return false;
  }
  await load(href, true);
  return true;
}
