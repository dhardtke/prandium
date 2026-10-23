import { describe, expect, test } from 'bun:test';
import { toDate, toFloat, toInt } from './convert.ts';

const UNPARSEABLE = ['', undefined, 'undefined', 'foo', '   ', '+'];

describe('toInt', () => {
  test.each(UNPARSEABLE)('falls back for %p', (str) => {
    expect(toInt(str, -1)).toBe(-1);
  });

  test.each<[string, number]>([
    ['42', 42],
    ['0', 0],
    ['12 servings', 12],
  ])('reads %p as %p', (str, expected) => {
    expect(toInt(str, -1)).toBe(expected);
  });
});

describe('toFloat', () => {
  test.each(UNPARSEABLE)('falls back for %p', (str) => {
    expect(toFloat(str, -1)).toBe(-1);
  });

  test.each<[string, number]>([
    ['42', 42],
    ['0', 0],
    ['4.25', 4.25],
  ])('reads %p as %p', (str, expected) => {
    expect(toFloat(str, -1)).toBe(expected);
  });
});

describe('toDate', () => {
  const fallback = new Date(0);

  test.each(['', undefined, 'abc'])('falls back for %p', (str) => {
    expect(toDate(str, fallback)).toEqual(fallback);
  });

  test.each<[string, Date]>([
    ['0', new Date(0)],
    ['1616804763', new Date(1616804763)],
    ['2016-09-12T00:00:00.000Z', new Date('2016-09-12T00:00:00.000Z')],
  ])('reads %p', (str, expected) => {
    expect(toDate(str)).toEqual(expected);
  });

  test('keeps a date', () => {
    const date = new Date(5);
    expect(toDate(date)).toBe(date);
  });
});
