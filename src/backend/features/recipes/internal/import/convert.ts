import { DIGITS } from './constants.ts';

function toNumber(str: string | null | undefined, parse: (str: string) => number, fallback: number): number {
  if (str === null || str === undefined) {
    return fallback;
  }
  const parsed = parse(str);
  return Number.isNaN(parsed) ? fallback : parsed;
}

export function toInt(str: string | null | undefined, fallback = 0): number {
  return toNumber(str, (value) => Number.parseInt(value, 10), fallback);
}

export function toFloat(str: string | null | undefined, fallback = 0): number {
  return toNumber(str, Number.parseFloat, fallback);
}

/** A digits-only string is read as epoch milliseconds. */
export function toDate(source: Date | string | undefined, fallback = new Date()): Date {
  if (source === undefined) {
    return fallback;
  }
  if (source instanceof Date) {
    return source;
  }
  const purelyNumeric = source !== '' && source.split('').every((char) => DIGITS.includes(char));
  const parsed = new Date(purelyNumeric ? toInt(source, Number.NaN) : source);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed;
}
