import { ApiError, UNAUTHORIZED_EVENT } from './errors.ts';

// A Blob goes as itself, typed by its own type; anything else as JSON.
async function request<T>(method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE', path: string, body?: unknown): Promise<T> {
  let response: Response;
  const blob = body instanceof Blob;
  try {
    response = await fetch(`/api${path}`, {
      method,
      headers: body === undefined ? undefined : { 'Content-Type': blob ? body.type : 'application/json' },
      // oxlint-disable-next-line unicorn/no-invalid-fetch-options
      body: body === undefined ? undefined : blob ? body : JSON.stringify(body),
    });
  } catch (cause) {
    throw new ApiError('Could not reach the prandium server', 0, cause);
  }

  const text = await response.text();
  let data: unknown = null;
  try {
    data = text === '' ? null : JSON.parse(text);
  } catch {
    data = null;
  }

  if (!response.ok) {
    const errorBody = typeof data === 'object' && data !== null ? data : {};
    const message = 'error' in errorBody && typeof errorBody.error === 'string' ? errorBody.error : `Request failed (${response.status})`;
    if (response.status === 401) {
      // globalThis is `window` in a browser; the tests of this module run without a DOM.
      globalThis.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }
    throw new ApiError(message, response.status, 'details' in errorBody ? errorBody.details : undefined);
  }

  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- the server contract boundary
  return data as T;
}

export const get = <T>(path: string): Promise<T> => request<T>('GET', path);

export const post = <T>(path: string, body?: unknown): Promise<T> => request<T>('POST', path, body ?? {});

export const put = <T>(path: string, body?: unknown): Promise<T> => request<T>('PUT', path, body ?? {});

export const patch = <T>(path: string, body?: unknown): Promise<T> => request<T>('PATCH', path, body ?? {});

export const remove = (path: string): Promise<null> => request<null>('DELETE', path);

export const putBlob = <T>(path: string, blob: Blob): Promise<T> => request<T>('PUT', path, blob);

/** A DELETE whose answer carries a body, unlike `remove`. */
export const removeReturning = <T>(path: string): Promise<T> => request<T>('DELETE', path);
