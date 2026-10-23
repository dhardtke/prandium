import type { Iso8601DateTime } from '../../../../shared/flavors.ts';

const pad = (n: number): string => String(n).padStart(2, '0');

/** The local date and time inputs for an ISO date-time. */
export function toLocalParts(iso: string): { date: string; time: string } {
  const value = new Date(iso);
  return {
    date: `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`,
    time: `${pad(value.getHours())}:${pad(value.getMinutes())}`,
  };
}

/** Local date and time back to an ISO date-time; null when the date is empty or invalid. A missing time is midnight. */
export function fromLocalParts(date: string, time: string): Iso8601DateTime | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return null;
  }
  const value = new Date(`${date}T${/^\d{2}:\d{2}$/.test(time) ? time : '00:00'}`);
  return Number.isNaN(value.getTime()) ? null : value.toISOString();
}
