import type { RouteTable } from '../../http/routing.ts';
import { createDevFacade, DevFacade } from './dev.facade.ts';

export function devRoutes(): RouteTable {
  if (!DevFacade.enabled()) {
    return {};
  }
  const dev = createDevFacade();
  return {
    '/dev/ws': (req, server) => dev.upgrade(req, server),
  };
}
