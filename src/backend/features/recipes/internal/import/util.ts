import { toInt } from './convert.ts';

// schema.org lets every property be one value or a list of them.
export function first(value: unknown): unknown {
  return Array.isArray(value) ? (value as unknown[])[0] : value;
}

export function ensureArray(value: unknown): unknown[] {
  if (value === undefined || value === null || value === '') {
    return [];
  }
  return Array.isArray(value) ? (value as unknown[]) : [value];
}

export function field(value: unknown, key: string): unknown {
  return typeof value === 'object' && value !== null ? Reflect.get(value, key) : undefined;
}

/** A number, or a number's text, as a string; anything else is undefined. */
export function text(value: unknown): string | undefined {
  if (typeof value === 'string') {
    return value;
  }
  return typeof value === 'number' && Number.isFinite(value) ? String(value) : undefined;
}

const NUMBER = /(\d+)/;

export function extractNumber(source: unknown): number | undefined {
  if (typeof source === 'number') {
    return Number.isFinite(source) ? source : undefined;
  }
  if (typeof source === 'string') {
    const match = NUMBER.exec(source);
    return match ? toInt(match[0]) : undefined;
  }
  return undefined;
}

export function extractFloat(source: unknown): number | undefined {
  if (typeof source === 'number') {
    return Number.isFinite(source) ? source : undefined;
  }
  if (typeof source === 'string') {
    const parsed = Number.parseFloat(source.replace(',', '.'));
    return Number.isNaN(parsed) ? undefined : parsed;
  }
  return undefined;
}
