import type { Server } from 'bun';

export class DevController {
  upgrade(req: Request, server: Server<undefined>): Response | undefined {
    if (server.upgrade(req)) {
      return undefined;
    }
    return new Response('Upgrade required', { status: 426 });
  }
}
