import { type RouteTable, wrapHandlers } from './routing.ts';

// A page sets its own Content-Security-Policy; anything else gets one that allows nothing.
const DEFAULTS: Record<string, string> = {
  'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'",
  'Referrer-Policy': 'same-origin',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
};

export function securityHeaders(table: RouteTable): RouteTable {
  return wrapHandlers(table, 'security headers', (handler) => async (req, server) => {
    const res = await handler(req, server);
    if (res instanceof Response) {
      for (const [name, value] of Object.entries(DEFAULTS)) {
        if (!res.headers.has(name)) {
          res.headers.set(name, value);
        }
      }
    }
    return res;
  });
}
