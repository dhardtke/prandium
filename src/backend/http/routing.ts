export type RouteTable = Bun.Serve.RoutesWithUpgrade<undefined, string>;

export type ParamRequest = Request & { params: Record<string, string | undefined> };

export type RouteHandler = Extract<RouteTable[string], (...args: never[]) => unknown>;

const METHODS = new Set(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']);

// A static value has no handler to wrap and would slip past the wrapper, so it is refused.
export function wrapHandlers(table: RouteTable, label: string, wrap: (handler: RouteHandler) => RouteHandler): RouteTable {
  const wrapped: RouteTable = {};
  for (const [path, value] of Object.entries(table)) {
    if (typeof value === 'function') {
      wrapped[path] = wrap(value);
    } else if (isMethodMap(value)) {
      wrapped[path] = Object.fromEntries(
        Object.entries(value).map(([method, handler]) => {
          if (typeof handler !== 'function') {
            throw new Error(`${label}: ${method} ${path} is a static value and cannot be wrapped`);
          }
          return [method, wrap(handler)];
        }),
      );
    } else {
      throw new Error(`${label}: ${path} is a static value and cannot be wrapped`);
    }
  }
  return wrapped;
}

function isMethodMap(value: RouteTable[string]): value is Partial<Record<Bun.Serve.HTTPMethod, RouteHandler | Response>> {
  return typeof value === 'object' && !(value instanceof Response) && !(value instanceof Blob) && Object.keys(value).every((key) => METHODS.has(key));
}
