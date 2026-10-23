// `/*` is a bare function, not a `{ GET, HEAD }` map, because it owns the server-wide 405.
import type { RouteTable } from '../../http/routing.ts';
import type { AuthFacade } from '../auth/auth.facade.ts';
import { createDevFacade } from '../dev/dev.facade.ts';
import { vendorUrls } from './internal/paths.ts';
import { StaticController } from './internal/static.controller.ts';
import { createWebFiles } from './internal/web-files.ts';

export function staticRoutes(auth: AuthFacade): RouteTable {
  const controller = new StaticController(auth, createDevFacade(), createWebFiles());
  const vendor = (req: Request): Promise<Response> => controller.vendor(req);
  return {
    ...Object.fromEntries(vendorUrls().map((url) => [url, { GET: vendor, HEAD: vendor }])),
    '/*': (req: Request): Promise<Response> => controller.frontend(req),
  };
}
