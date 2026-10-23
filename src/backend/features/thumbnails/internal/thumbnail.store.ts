import { existsSync } from 'node:fs';
import { mkdir, rm } from 'node:fs/promises';
import { basename, extname, join, parse, resolve, sep } from 'node:path';

export type ThumbnailFetch = (url: string, userAgent: string) => Promise<Response>;

const fetchWithUserAgent: ThumbnailFetch = (url, userAgent) => fetch(url, { headers: { 'User-Agent': userAgent } });

const EXTENSIONS: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
  'image/avif': '.avif',
  'image/svg+xml': '.svg',
};

// File names come from URLs and uploads; anything a path or a shell would read specially becomes a dash.
function safeName(name: string): string {
  // oxlint-disable-next-line no-control-regex -- control characters are exactly what it removes
  const cleaned = name.replaceAll(/[\\/:*?"<>|\0-\x1f]/g, '-').replace(/^\.+/, '');
  return cleaned === '' ? 'thumbnail' : cleaned.slice(0, 120);
}

export function getUniqueFilename(dir: string, wanted: string): string {
  const { name, ext } = parse(safeName(wanted));
  let candidate = `${name}${ext}`;
  for (let i = 1; existsSync(join(dir, candidate)); i++) {
    candidate = `${name}-${i}${ext}`;
  }
  return candidate;
}

export function extensionFor(type: string): string {
  return EXTENSIONS[type] ?? '';
}

/** Thumbnails are plain files in one directory; the database stores their names. */
export class ThumbnailStore {
  readonly #dir: string;

  constructor(dir: string) {
    this.#dir = resolve(dir);
  }

  /** null for a name that would leave the directory. */
  resolve(file: string): string | null {
    if (file === '' || file.includes('\0')) {
      return null;
    }
    const target = resolve(this.#dir, file);
    return target.startsWith(this.#dir + sep) ? target : null;
  }

  async write(bytes: Uint8Array, suggestedName: string, type: string): Promise<string> {
    await mkdir(this.#dir, { recursive: true });
    const wanted = extname(suggestedName) === '' ? `${suggestedName}${extensionFor(type)}` : suggestedName;
    const file = getUniqueFilename(this.#dir, wanted);
    await Bun.write(join(this.#dir, file), bytes);
    return file;
  }

  async remove(file: string): Promise<void> {
    const target = this.resolve(file);
    if (target !== null) {
      await rm(target, { force: true });
    }
  }

  async download(url: string, userAgent: string, fetchFn: ThumbnailFetch = fetchWithUserAgent): Promise<string> {
    const response = await fetchFn(url, userAgent);
    if (!response.ok) {
      throw new Error(`The image answered ${response.status}`);
    }
    const type = response.headers.get('Content-Type')?.split(';', 1)[0]?.trim() ?? '';
    const name = basename(decodeURIComponent(new URL(url).pathname));
    return this.write(await response.bytes(), name, type);
  }
}
