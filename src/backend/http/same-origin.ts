import { forbidden } from './errors.ts';
import { type RouteTable, wrapHandlers } from './routing.ts';

const SAFE = new Set(['GET', 'HEAD', 'OPTIONS']);
const ALLOWED_SITES = new Set(['same-origin', 'none']);

// Browsers send Sec-Fetch-Site; curl and the deploy script send none and are let through.
export function sameOriginWrites(table: RouteTable): RouteTable {
  return wrapHandlers(table, 'same-origin writes', (handler) => (req, server) => {
    const site = req.headers.get('Sec-Fetch-Site');
    if (!SAFE.has(req.method) && site !== null && !ALLOWED_SITES.has(site)) {
      throw forbidden('Cross-site request refused');
    }
    return handler(req, server);
  });
}
