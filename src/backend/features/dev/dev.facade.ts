import type { Server, WebSocketHandler } from 'bun';
import { EMBEDDED } from '../../shared/embedded.ts';
import { createStaticFacade, type StaticFacade } from '../static/static.facade.ts';
import { DevController } from './internal/dev.controller.ts';
import { devWebSocket } from './internal/ws.ts';

const CLIENT_TAG = '<script type="module" src="/dev/hot.ts"></script>';

export class DevFacade {
  readonly #static: StaticFacade;
  readonly #controller = new DevController();

  constructor(staticFacade: StaticFacade) {
    this.#static = staticFacade;
  }

  /** Read per call so tests can flip it; a built file has no source tree, so always off. */
  static enabled(): boolean {
    return EMBEDDED === null && process.env.CENA_DEV === '1';
  }

  upgrade(req: Request, server: Server<undefined>): Response | undefined {
    return this.#controller.upgrade(req, server);
  }

  webSocket(): WebSocketHandler<undefined> {
    return devWebSocket(this.#static.webRoot());
  }

  async injectClient(html: string | Uint8Array<ArrayBuffer>): Promise<Uint8Array<ArrayBuffer>> {
    if (!DevFacade.enabled()) {
      return typeof html === 'string' ? new TextEncoder().encode(html) : html;
    }
    const rewritten = new HTMLRewriter()
      .on('head', {
        element: (el) => {
          el.append(CLIENT_TAG, { html: true });
        },
      })
      .transform(new Response(html));
    return rewritten.bytes();
  }
}

export function createDevFacade(): DevFacade {
  return new DevFacade(createStaticFacade());
}
