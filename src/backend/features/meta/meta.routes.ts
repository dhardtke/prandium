import type { RouteTable } from '../../http/routing.ts';
import type { AuthFacade } from '../auth/auth.facade.ts';
import { MetaController } from './internal/meta.controller.ts';

/** Public whether or not auth is on: the deploy script reads `auth` from the health check. */
export function metaRoutes(auth: AuthFacade): RouteTable {
  const controller = new MetaController(auth);
  return {
    ...healthRoute(controller),
    ...notFoundRoute(controller),
  };
}

function healthRoute(controller: MetaController): RouteTable {
  return {
    '/api/health': {
      GET: () => controller.health(),
    },
  };
}

// `/api/*` misses bare `/api`, which would otherwise fall through to the single-page app.
function notFoundRoute(controller: MetaController): RouteTable {
  const endpointNotFound = (): Response => controller.endpointNotFound();
  return {
    '/api': endpointNotFound,
    '/api/*': endpointNotFound,
  };
}
