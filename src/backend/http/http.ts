import { badRequest, unsupportedMediaType } from './errors.ts';

export function json(data: unknown, status = 200, headers: HeadersInit = {}): Response {
  return Response.json(data, { status, headers });
}

export function noContent(): Response {
  return new Response(null, { status: 204 });
}

function isJsonObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// A cross-origin fetch cannot send application/json without a preflight, which nothing here answers.
export async function readJsonObject(req: Request): Promise<Record<string, unknown>> {
  const type = req.headers.get('Content-Type')?.split(';', 1)[0]?.trim().toLowerCase();
  if (type !== 'application/json') {
    throw unsupportedMediaType('Request body must be sent as application/json');
  }
  let parsed: unknown;
  try {
    parsed = await req.json();
  } catch {
    throw badRequest('Request body must be valid JSON');
  }
  if (!isJsonObject(parsed)) {
    throw badRequest('Request body must be a JSON object');
  }
  return parsed;
}

export function pathId(raw: string | undefined, what: string): number {
  const id = Number(raw);
  if (!Number.isInteger(id) || id < 1) {
    throw badRequest(`Invalid ${what} id`);
  }
  return id;
}

export function queryInt(params: URLSearchParams, key: string, fallback: number, bounds: { min?: number; max?: number } = {}): number {
  return optionalQueryInt(params, key, bounds) ?? fallback;
}

export function optionalQueryInt(params: URLSearchParams, key: string, { min = 0, max = 1000 }: { min?: number; max?: number } = {}): number | null {
  const raw = params.get(key);
  if (raw === null || raw === '') {
    return null;
  }
  const num = Number(raw);
  if (!Number.isInteger(num) || num < min || num > max) {
    throw badRequest(`"${key}" must be a whole number between ${min} and ${max}`);
  }
  return num;
}

export function optionalQueryOneOf<V extends string>(params: URLSearchParams, key: string, values: readonly V[]): V | null {
  const raw = params.get(key);
  if (raw === null || raw === '') {
    return null;
  }
  const value = values.find((candidate) => candidate === raw);
  if (value === undefined) {
    throw badRequest(`"${key}" must be one of: ${values.join(', ')}`);
  }
  return value;
}

export function optionalQueryString(params: URLSearchParams, key: string, maxLength: number): string | null {
  const raw = params.get(key)?.trim() ?? '';
  if (raw === '') {
    return null;
  }
  if (raw.length > maxLength) {
    throw badRequest(`"${key}" must be at most ${maxLength} characters`);
  }
  return raw;
}

// Every value of a repeated key, as ids: `?tag=1&tag=2`.
export function queryIds(params: URLSearchParams, key: string, { max = 200 }: { max?: number } = {}): number[] {
  const values = params.getAll(key).filter((raw) => raw !== '');
  if (values.length > max) {
    throw badRequest(`"${key}" may be given at most ${max} times`);
  }
  const ids = new Set<number>();
  for (const raw of values) {
    const id = Number(raw);
    if (!Number.isSafeInteger(id) || id < 1) {
      throw badRequest(`"${key}" must hold only whole numbers of at least 1`);
    }
    ids.add(id);
  }
  return [...ids];
}

export interface RawBody {
  bytes: Uint8Array<ArrayBuffer>;
  type: string;
}

// `types` are prefixes such as 'image/'; anything else is a 415, as a non-JSON body is to readJsonObject.
export async function readBytes(req: Request, { types, maxBytes }: { types: readonly string[]; maxBytes: number }): Promise<RawBody> {
  const type = req.headers.get('Content-Type')?.split(';', 1)[0]?.trim().toLowerCase() ?? '';
  if (!types.some((prefix) => type.startsWith(prefix))) {
    throw unsupportedMediaType(`Request body must be sent as ${types.map((prefix) => `${prefix}*`).join(' or ')}`);
  }
  const bytes = await req.bytes();
  if (bytes.byteLength === 0) {
    throw badRequest('Request body must not be empty');
  }
  if (bytes.byteLength > maxBytes) {
    throw badRequest(`Request body must be at most ${maxBytes} bytes`);
  }
  return { bytes, type };
}
