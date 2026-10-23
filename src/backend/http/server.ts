import type { Server } from 'bun';
import type { Config } from '../config.ts';
import type { DB } from '../db/db.ts';
import { createDevFacade } from '../features/dev/dev.facade.ts';
import { log } from '../shared/log.ts';
import { errorResponse } from './errors.ts';
import { MAX_BODY_BYTES } from './http.ts';
import { allRoutes } from './routes.ts';

export { MAX_BODY_BYTES } from './http.ts';

/** `now` is the login throttle's and the session cookie's clock; only tests pass one. */
export function startServer(db: DB, config: Config, now?: () => number): Server<undefined> {
  return Bun.serve({
    hostname: config.host,
    port: config.port,
    routes: allRoutes(db, config, now),
    // The largest body is a thumbnail upload.
    maxRequestBodySize: MAX_BODY_BYTES,
    // Unconditional: making it optional flips Bun.serve's options type; only `/dev/ws` is gated.
    websocket: createDevFacade().webSocket(),
    // A safety net: the access log catches every throw from a route first.
    error: (err) => {
      log.error('http', 'unhandled error outside a route', err);
      return errorResponse(err);
    },
  });
}
