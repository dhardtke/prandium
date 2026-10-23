import { log } from '../shared/log.ts';
import { errorResponse } from './errors.ts';
import { type RouteHandler, type RouteTable, wrapHandlers } from './routing.ts';

const WRITES = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const MAX_BODY = 1024;

// Catches throws here rather than in Bun's `error` hook, which is not handed the request.
export function accessLog(table: RouteTable): RouteTable {
  return wrapHandlers(table, 'access log', (handler) => async (req, server) => {
    const start = performance.now();
    // Cloned before the handler consumes the body.
    const copy = WRITES.has(req.method) ? req.clone() : null;
    let res: Awaited<ReturnType<RouteHandler>>;
    let error: unknown;
    try {
      res = await handler(req, server);
    } catch (err) {
      error = err;
      res = errorResponse(err);
    }
    // undefined means a WebSocket upgrade.
    if (res instanceof Response) {
      const ms = performance.now() - start;
      const url = new URL(req.url);
      if (url.pathname === '/api' || url.pathname.startsWith('/api/') || res.status >= 500) {
        const line = `${req.method} ${url.pathname}${url.search} ${res.status} ${Math.round(ms)}ms`;
        const text = copy === null ? '' : await copy.text();
        const payload = text === '' ? undefined : describeBody(text);
        if (res.status >= 500) {
          log.error('http', line, error, payload);
        } else {
          log.info('http', line, payload);
        }
      }
    }
    return res;
  });
}

// A non-JSON body shows only its size, so a malformed login cannot leak a password.
export function describeBody(text: string): string {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return `[${Buffer.byteLength(text)} bytes, not JSON]`;
  }
  const shown = JSON.stringify(redact(parsed));
  return shown.length > MAX_BODY ? `${shown.slice(0, MAX_BODY)}…(+${shown.length - MAX_BODY} more)` : shown;
}

function redact(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(redact);
  }
  if (typeof value === 'object' && value !== null) {
    return Object.fromEntries(Object.entries(value).map(([key, inner]) => [key, key === 'password' ? '[redacted]' : redact(inner)]));
  }
  return value;
}
