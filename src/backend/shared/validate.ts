import { badRequest } from '../http/errors.ts';

export function requiredString<T extends object>(dto: T, field: keyof T & string, maxLength = 200): string {
  const value: unknown = dto[field];
  if (typeof value !== 'string' || value.trim() === '') {
    throw badRequest(`"${field}" is required and must be a non-empty string`);
  }
  const trimmed = value.trim();
  if (trimmed.length > maxLength) {
    throw badRequest(`"${field}" must be at most ${maxLength} characters`);
  }
  return trimmed;
}

export function optionalString<T extends object>(dto: T, field: keyof T & string, maxLength = 2000): string | null {
  const value: unknown = dto[field];
  if (value === undefined || value === null) {
    return null;
  }
  if (typeof value !== 'string') {
    throw badRequest(`"${field}" must be a string`);
  }
  const trimmed = value.trim();
  if (trimmed === '') {
    return null;
  }
  if (trimmed.length > maxLength) {
    throw badRequest(`"${field}" must be at most ${maxLength} characters`);
  }
  return trimmed;
}

export function requiredInt<T extends object>(
  dto: T,
  field: keyof T & string,
  { min = 0, max = Number.MAX_SAFE_INTEGER }: { min?: number; max?: number } = {},
): number {
  const value: unknown = dto[field];
  const num = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
  if (typeof num !== 'number' || !Number.isInteger(num)) {
    throw badRequest(`"${field}" must be a whole number`);
  }
  if (num < min || num > max) {
    throw badRequest(`"${field}" must be between ${min} and ${max}`);
  }
  return num;
}

/** Unlike `requiredInt`, a numeric string is refused. */
export function requiredIds<T extends object>(dto: T, field: keyof T & string, { max = 200 }: { max?: number } = {}): number[] {
  const value: unknown = dto[field];
  if (!Array.isArray(value) || value.length === 0 || value.length > max) {
    throw badRequest(`"${field}" must be a list of 1 to ${max} ids`);
  }
  const ids = new Set<number>();
  for (const id of value as unknown[]) {
    if (typeof id !== 'number' || !Number.isSafeInteger(id) || id < 1) {
      throw badRequest(`"${field}" must hold only whole numbers of at least 1`);
    }
    if (ids.has(id)) {
      throw badRequest(`"${field}" must not repeat an id`);
    }
    ids.add(id);
  }
  return [...ids];
}

export function requiredNumber<T extends object>(dto: T, field: keyof T & string, { min = 0, max = 100000 }: { min?: number; max?: number } = {}): number {
  const value: unknown = dto[field];
  const num = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
  if (typeof num !== 'number' || !Number.isFinite(num)) {
    throw badRequest(`"${field}" must be a number`);
  }
  if (num < min || num > max) {
    throw badRequest(`"${field}" must be between ${min} and ${max}`);
  }
  return Math.round(num * 100) / 100;
}

export function requiredBoolean<T extends object>(dto: T, field: keyof T & string): boolean {
  const value: unknown = dto[field];
  if (typeof value !== 'boolean') {
    throw badRequest(`"${field}" must be true or false`);
  }
  return value;
}

function isOneOf<V extends string>(values: readonly V[], value: unknown): value is V {
  return typeof value === 'string' && (values as readonly string[]).includes(value);
}

export function requiredOneOf<T extends object, V extends string>(dto: T, field: keyof T & string, values: readonly V[]): V {
  const value: unknown = dto[field];
  if (!isOneOf(values, value)) {
    throw badRequest(`"${field}" must be one of: ${values.join(', ')}`);
  }
  return value;
}

export function optionalOneOf<T extends object, V extends string>(dto: T, field: keyof T & string, values: readonly V[]): V | null {
  const value: unknown = dto[field];
  if (value === undefined || value === null || value === '') {
    return null;
  }
  return requiredOneOf(dto, field, values);
}

/** null and undefined are null; any other value must be a number in range. */
export function optionalNumber<T extends object>(dto: T, field: keyof T & string, bounds: { min?: number; max?: number } = {}): number | null {
  const value: unknown = dto[field];
  return value === undefined || value === null ? null : requiredNumber(dto, field, bounds);
}

/** Trims each entry and drops the blank ones; `maxItems` counts what is left. */
export function stringList<T extends object>(dto: T, field: keyof T & string, { maxItems, maxLength }: { maxItems: number; maxLength: number }): string[] {
  const value: unknown = dto[field];
  if (value === undefined || value === null) {
    return [];
  }
  if (!Array.isArray(value)) {
    throw badRequest(`"${field}" must be a list of strings`);
  }
  const items: string[] = [];
  for (const item of value as unknown[]) {
    if (typeof item !== 'string') {
      throw badRequest(`"${field}" must hold only strings`);
    }
    const trimmed = item.trim();
    if (trimmed.length > maxLength) {
      throw badRequest(`"${field}" entries must be at most ${maxLength} characters`);
    }
    if (trimmed !== '') {
      items.push(trimmed);
    }
  }
  if (items.length > maxItems) {
    throw badRequest(`"${field}" must hold at most ${maxItems} entries`);
  }
  return items;
}

const ISO_DATE_TIME = /^(\d{4})-(\d{2})-(\d{2})T([01]\d|2[0-3]):[0-5]\d(:[0-5]\d(\.\d{1,9})?)?(Z|[+-]\d{2}:\d{2})$/;

/** A date-time with its offset, such as `2026-10-23T18:30:00.000Z`; `Date.parse` alone would roll 2026-02-30 over into March. */
export function isIsoDateTime(value: string): boolean {
  const match = ISO_DATE_TIME.exec(value);
  if (!match || Number.isNaN(Date.parse(value))) {
    return false;
  }
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

/** Each entry normalized to `toISOString()`. */
export function dateTimeList<T extends object>(dto: T, field: keyof T & string, { maxItems }: { maxItems: number }): string[] {
  const value: unknown = dto[field];
  if (value === undefined || value === null) {
    return [];
  }
  if (!Array.isArray(value) || value.length > maxItems) {
    throw badRequest(`"${field}" must be a list of at most ${maxItems} date-times`);
  }
  return (value as unknown[]).map((item) => {
    if (typeof item !== 'string' || !isIsoDateTime(item)) {
      throw badRequest(`"${field}" must hold only ISO 8601 date-times with an offset`);
    }
    return new Date(item).toISOString();
  });
}

// Runs a field's rule only when the DTO carries the field, so an edit leaves the others alone.
export function validatePresent<T extends object>(dto: T, rules: { [K in keyof T]-?: () => T[K] }): Partial<T> {
  const valid: Partial<T> = {};
  for (const field in rules) {
    if (dto[field] !== undefined) {
      valid[field] = rules[field]();
    }
  }
  return valid;
}
