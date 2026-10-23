export class ApiError extends Error {
  // 0 when the request never left.
  status: number;
  details: unknown;

  constructor(message: string, status: number, details: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

// An event, not a call: `http/` may not import the router in `app/`.
export const UNAUTHORIZED_EVENT = 'pr:unauthorized';
