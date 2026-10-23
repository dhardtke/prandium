import { extname } from 'node:path';
import type { AuthFacade } from '../../auth/auth.facade.ts';
import type { DevFacade } from '../../dev/dev.facade.ts';
import { contentTag } from './content-tag.ts';
import { contentSecurityPolicy } from './csp.ts';
import { embedAuthStatus } from './page.ts';
import type { WebFile, WebFiles } from './web-files.ts';

export class StaticController {
  readonly #auth: AuthFacade;
  readonly #dev: DevFacade;
  readonly #files: WebFiles;

  constructor(auth: AuthFacade, dev: DevFacade, files: WebFiles) {
    this.#auth = auth;
    this.#dev = dev;
    this.#files = files;
  }

  async vendor(req: Request): Promise<Response> {
    const file = await this.#files.vendor(new URL(req.url).pathname);
    if (file.kind === 'file') {
      return this.#respond(req, file.body, { 'Content-Type': file.type });
    }
    if (file.kind === 'error') {
      return new Response(file.message, { status: 500 });
    }
    return new Response('Not found', { status: 404 });
  }

  async frontend(req: Request): Promise<Response> {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      return new Response('Method not allowed', { status: 405 });
    }

    const { pathname } = new URL(req.url);
    const isDirectory = pathname === '/' || pathname.endsWith('/');

    // `/` arrives as `/index.html`.
    const file = await this.#files.page(isDirectory ? `${pathname}index.html` : pathname);
    switch (file.kind) {
      case 'file':
        return this.#serve(req, file);
      case 'error':
        return new Response(file.message, { status: 500 });
      case 'invalid':
        return new Response('Not found', { status: 404 });
      case 'missing':
        break;
    }

    // A trailing slash asked for a missing directory index: a miss, not a client route.
    if (extname(pathname) === '' && !isDirectory) {
      const index = await this.#files.page('/index.html');
      if (index.kind === 'file') {
        return this.#serve(req, index);
      }
    }
    return new Response('Not found', { status: 404 });
  }

  /** Injects before hashing, so the ETag covers the auth status and the hot-reload client. */
  async #serve(req: Request, file: WebFile & { kind: 'file' }): Promise<Response> {
    if (!file.type.startsWith('text/html')) {
      return this.#respond(req, file.body, { 'Content-Type': file.type });
    }
    const body = await this.#dev.injectClient(await embedAuthStatus(file.body, { enabled: this.#auth.enabled() }));
    return this.#respond(req, body, { 'Content-Type': file.type, 'Content-Security-Policy': await contentSecurityPolicy(body) });
  }

  #respond(req: Request, body: string | Uint8Array<ArrayBuffer>, headers: Record<string, string>): Response {
    const tag = contentTag(body);
    const etag = `"${tag}"`;
    const current = new URL(req.url).searchParams.get('v') === tag;
    const cache = { ETag: etag, 'Cache-Control': current ? IMMUTABLE : 'no-cache' };
    if (matchesEtag(req.headers.get('If-None-Match'), etag)) {
      // A 304's headers replace the cached ones, so without the page's policy it would get the API's.
      const policy = headers['Content-Security-Policy'];
      return new Response(null, { status: 304, headers: policy === undefined ? cache : { ...cache, 'Content-Security-Policy': policy } });
    }
    return new Response(body, { headers: { ...headers, ...cache } });
  }
}

/** `immutable` also spares the revalidation a reload would send. */
const IMMUTABLE = 'public, max-age=31536000, immutable';

/** RFC 9110 weak comparison. */
function matchesEtag(header: string | null, etag: string): boolean {
  if (header === null) {
    return false;
  }
  return header.split(',').some((entry) => {
    const tag = entry.trim();
    return tag === '*' || tag.replace(/^W\//, '') === etag;
  });
}
