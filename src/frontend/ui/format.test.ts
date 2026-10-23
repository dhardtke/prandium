import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { useGlobals } from '../testing.ts';
import { formatDate, formatMinutes, formatNumber, formatRelative } from './format.ts';
import { setLanguage } from './i18n.ts';

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

// Registered before useGlobals(), whose afterEach removes the window this one still needs.
afterEach(() => {
  setLanguage('en');
});

const stub = useGlobals();

beforeEach(() => {
  stub('window', new EventTarget());
});

describe('formatRelative', () => {
  test.each<[number, number, string]>([
    [0, 0, 'now'],
    [0, SECOND, '1 second ago'],
    [SECOND, 0, 'in 1 second'],
    [0, MINUTE, '1 minute ago'],
    [0, HOUR, '1 hour ago'],
    [0, DAY, 'yesterday'],
    [DAY, 0, 'tomorrow'],
    [0, 3 * DAY, '3 days ago'],
    [0, 45 * DAY, 'last month'],
    [0, 800 * DAY, '2 years ago'],
  ])('%p relative to %p is %p', (date, now, expected) => {
    expect(formatRelative(new Date(date), new Date(now))).toBe(expected);
  });

  test('reads an ISO string', () => {
    expect(formatRelative('2026-10-20T12:00:00Z', new Date('2026-10-23T12:00:00Z'))).toBe('3 days ago');
  });

  test('speaks the current language', () => {
    setLanguage('de');
    expect(formatRelative(new Date(0), new Date(DAY))).toBe('gestern');
    expect(formatRelative(new Date(0), new Date(3 * DAY))).toBe('vor 3 Tagen');
  });
});

describe('formatMinutes', () => {
  test.each<[number, string]>([
    [1, '1 minute'],
    [35, '35 minutes'],
    [60, '1 hour'],
    [150, '3 hours'],
    [1440, '1 day'],
  ])('%p minutes are %p', (minutes, expected) => {
    expect(formatMinutes(minutes)).toBe(expected);
  });

  test('speaks the current language', () => {
    setLanguage('de');
    expect(formatMinutes(35)).toBe('35 Minuten');
  });
});

describe('formatNumber', () => {
  test('rounds to two decimals by default', () => {
    expect(formatNumber(4.215)).toBe('4.22');
  });

  test('takes the decimals and the separators of the language', () => {
    expect(formatNumber(1234.5, 1)).toBe('1,234.5');
    setLanguage('de');
    expect(formatNumber(1234.5, 1)).toBe('1.234,5');
  });
});

describe('formatDate', () => {
  test('formats in the medium style by default', () => {
    expect(formatDate('2024-03-12T10:00:00Z')).toBe('Mar 12, 2024');
  });

  test('takes options and the language', () => {
    setLanguage('de');
    expect(formatDate(new Date(0), { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'UTC' })).toBe('01. Januar 1970');
  });
});
