import { json } from './http.ts';
import type { ErrorDto } from '../../shared/dto/error.ts';

export class HttpError extends Error {
  readonly status: number;

  readonly details: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.details = details;
  }
}

export const badRequest = (message: string, details?: unknown): HttpError => new HttpError(400, message, details);
export const unauthorized = (message = 'Not logged in'): HttpError => new HttpError(401, message);
export const forbidden = (message: string): HttpError => new HttpError(403, message);
export const notFound = (what: string): HttpError => new HttpError(404, `${what} not found`);
export const conflict = (message: string): HttpError => new HttpError(409, message);
export const unsupportedMediaType = (message: string): HttpError => new HttpError(415, message);

export function errorResponse(err: unknown): Response {
  if (err instanceof HttpError) {
    const body: ErrorDto = { error: err.message, details: err.details ?? undefined };
    return json(body, err.status);
  }
  const body: ErrorDto = { error: 'Internal server error' };
  return json(body, 500);
}
