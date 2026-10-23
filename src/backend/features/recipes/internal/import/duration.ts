import { DIGITS } from './constants.ts';
import { toInt } from './convert.ts';

export interface Duration {
  years: number;
  months: number;
  weeks: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

// PYYYYMMDDThhmmss
const DATE_TIME = /^P(?<years>\d{4})(?<months>\d{2})(?<days>\d{2})T(?<hours>\d{2})(?<minutes>\d{2})(?<seconds>\d{2})$/;

// P[YYYY]-[MM]-[DD]T[hh]:[mm]:[ss]
const DATE_TIME_EXTENDED = /^P(?<years>\d{4})-(?<months>\d{2})-(?<days>\d{2})T(?<hours>\d{2}):(?<minutes>\d{2}):(?<seconds>\d{2})$/;

const DATE_DESIGNATORS = ['Y', 'M', 'W', 'D'] as const;
const TIME_DESIGNATORS = ['H', 'M', 'S'] as const;

/** Parses an ISO 8601 duration (https://en.wikipedia.org/wiki/ISO_8601#Durations). */
export function parseDuration(iso8601duration: string): Duration {
  if (!iso8601duration.startsWith('P')) {
    throw new Error("Duration must start with 'P'");
  }

  const groups = (DATE_TIME.exec(iso8601duration) ?? DATE_TIME_EXTENDED.exec(iso8601duration))?.groups;
  if (groups) {
    return {
      years: toInt(groups.years),
      months: toInt(groups.months),
      weeks: 0,
      days: toInt(groups.days),
      hours: toInt(groups.hours),
      minutes: toInt(groups.minutes),
      seconds: toInt(groups.seconds),
    };
  }

  const pending: string[] = [];
  let sawTime = false;
  const date = new Map<string, string[]>();
  const time = new Map<string, string[]>();
  for (let i = 1; i < iso8601duration.length; i++) {
    const char = iso8601duration.charAt(i);
    if (DIGITS.includes(char) || char === '.' || char === ',') {
      pending.push(char);
    } else if (!sawTime && char === 'T') {
      if (pending.length > 0) {
        throw new Error('Unexpected T: Expected designator.');
      }
      sawTime = true;
    } else {
      const designators: readonly string[] = sawTime ? TIME_DESIGNATORS : DATE_DESIGNATORS;
      if (!designators.includes(char)) {
        throw new Error(`Unexpected character ${char} at position ${i}`);
      }
      (sawTime ? time : date).set(char, [...pending]);
      pending.length = 0;
    }
  }

  const ordered = [...DATE_DESIGNATORS.map((key) => date.get(key) ?? []), ...TIME_DESIGNATORS.map((key) => time.get(key) ?? [])];
  const nonEmpty = ordered.filter((digits) => digits.length > 0);
  if (pending.length > 0 || nonEmpty.length === 0) {
    throw new Error('Unexpected end of input.');
  }

  const fractional = nonEmpty.findIndex((digits) => digits.includes('.') || digits.includes(','));
  if (fractional > -1 && fractional !== nonEmpty.length - 1) {
    throw new Error('Only the smallest provided designator is allowed to be a float');
  }

  const value = (digits: string[] | undefined): number => (digits && digits.length > 0 ? Number.parseFloat(digits.join('').replace(',', '.')) : 0);

  return {
    years: value(date.get('Y')),
    months: value(date.get('M')),
    weeks: value(date.get('W')),
    days: value(date.get('D')),
    hours: value(time.get('H')),
    minutes: value(time.get('M')),
    seconds: value(time.get('S')),
  };
}

const HOUR = 60;
const DAY = HOUR * 24;

export function durationToMinutes(duration: Duration): number {
  return (
    duration.years * 365 * DAY +
    duration.weeks * 7 * DAY +
    duration.months * 31 * DAY +
    duration.days * DAY +
    duration.hours * HOUR +
    duration.minutes +
    Math.round(duration.seconds / 60)
  );
}
