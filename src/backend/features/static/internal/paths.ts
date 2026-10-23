import { normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

// Five levels up from this module; `paths.test.ts` fails loudly if the file moves.
const REPO_ROOT = resolve(fileURLToPath(new URL('../../../../..', import.meta.url)));
export const FRONTEND_DIR = resolve(REPO_ROOT, 'src', 'frontend');

// An allowlist of single files, so installing a package never exposes anything else.
const VENDOR_FILES: Record<string, string> = {
  '/vendor/oat.css': '@knadh/oat/oat.min.css',
  '/vendor/oat.js': '@knadh/oat/oat.min.js',
};

export function vendorUrls(): string[] {
  return Object.keys(VENDOR_FILES);
}

export function isShipped(url: string): boolean {
  return !url.startsWith('/dev/') && url !== '/testing.ts' && !url.endsWith('.test.ts') && !url.endsWith('.fixtures.ts');
}

export function isVersioned(url: string): boolean {
  return isShipped(url) && (url.endsWith('.ts') || url.endsWith('.css'));
}

export function resolveVendorPath(pathname: string): string | null {
  const specifier = VENDOR_FILES[pathname];
  if (!specifier) {
    return null;
  }
  try {
    return Bun.resolveSync(specifier, REPO_ROOT);
  } catch {
    return null;
  }
}

export function resolveStaticPath(pathname: string): string | null {
  let decoded: string;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return null;
  }
  if (decoded.includes('\0')) {
    return null;
  }

  const target = resolve(FRONTEND_DIR, `.${normalize(decoded)}`);
  if (target !== FRONTEND_DIR && !target.startsWith(FRONTEND_DIR + sep)) {
    return null;
  }
  return target;
}
