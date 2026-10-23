import { stat } from 'node:fs/promises';
import { notFound } from '../../../http/errors.ts';
import type { ThumbnailsFacade } from '../thumbnails.facade.ts';

const PREFIX = '/thumbnails/';

/** RFC 9110 weak comparison. */
function matchesEtag(header: string | null, etag: string): boolean {
  return (
    header?.split(',').some((entry) => {
      const tag = entry.trim();
      return tag === '*' || tag.replace(/^W\//, '') === etag;
    }) ?? false
  );
}

export class ThumbnailController {
  readonly #thumbnails: ThumbnailsFacade;

  constructor(thumbnails: ThumbnailsFacade) {
    this.#thumbnails = thumbnails;
  }

  async serve(req: Request): Promise<Response> {
    const pathname = new URL(req.url).pathname;
    let file: string;
    try {
      file = decodeURIComponent(pathname.slice(PREFIX.length));
    } catch {
      throw notFound('Thumbnail');
    }
    const path = file.includes('/') || file.includes('\\') ? null : this.#thumbnails.resolve(file);
    const info = path === null ? null : await stat(path).catch(() => null);
    if (path === null || info?.isFile() !== true) {
      throw notFound('Thumbnail');
    }

    const etag = `"${info.size.toString(36)}-${Math.trunc(info.mtimeMs).toString(36)}"`;
    // A name is reused only after its file is removed, so revalidating is cheap and enough.
    const headers = { ETag: etag, 'Cache-Control': 'private, no-cache' };
    if (matchesEtag(req.headers.get('If-None-Match'), etag)) {
      return new Response(null, { status: 304, headers });
    }
    const body = Bun.file(path);
    return new Response(req.method === 'HEAD' ? null : body, {
      headers: { ...headers, 'Content-Type': body.type, 'Content-Length': String(info.size) },
    });
  }
}
