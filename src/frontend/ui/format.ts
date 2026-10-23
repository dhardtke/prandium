import { language } from './i18n.ts';

const DAY_MS = 24 * 60 * 60 * 1000;

const UNITS: readonly { unit: Intl.RelativeTimeFormatUnit; ms: number }[] = [
  { unit: 'year', ms: DAY_MS * 365 },
  { unit: 'month', ms: (DAY_MS * 365) / 12 },
  { unit: 'day', ms: DAY_MS },
  { unit: 'hour', ms: 60 * 60 * 1000 },
  { unit: 'minute', ms: 60 * 1000 },
  { unit: 'second', ms: 1000 },
];

function closestUnit(ms: number): { unit: Intl.RelativeTimeFormatUnit; amount: number } {
  const match = UNITS.find((candidate) => Math.abs(ms) >= candidate.ms) ?? { unit: 'second', ms: 1000 };
  return { unit: match.unit, amount: Math.round(ms / match.ms) };
}

function locale(): string {
  return language().meta.bcp47;
}

/** "3 days ago", "yesterday", "in 2 hours", relative to `now`. */
export function formatRelative(date: Date | string, now: Date = new Date()): string {
  const { unit, amount } = closestUnit(new Date(date).getTime() - now.getTime());
  return new Intl.RelativeTimeFormat(locale(), { numeric: 'auto' }).format(amount, unit);
}

/** "35 minutes", "2 hours": the closest whole unit. */
export function formatMinutes(minutes: number): string {
  const { unit, amount } = closestUnit(minutes * 60 * 1000);
  return new Intl.NumberFormat(locale(), { style: 'unit', unit, unitDisplay: 'long' }).format(amount);
}

export function formatNumber(value: number, decimals = 2): string {
  return new Intl.NumberFormat(locale(), { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value);
}

export function formatDate(date: Date | string, options: Intl.DateTimeFormatOptions = { dateStyle: 'medium' }): string {
  return new Intl.DateTimeFormat(locale(), options).format(new Date(date));
}
