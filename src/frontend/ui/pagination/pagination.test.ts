import { describe, expect, test } from 'bun:test';
import { MAX_OFFSET, pageCount, pageItems, pageOffset, pagePath, parsePage } from './pagination.ts';

describe('parsePage', () => {
  test.each(['', '?page=abc', '?page=0', '?page=-1', '?page=2.5', '?page='])('%p is page 1', (search) => {
    expect(parsePage(search)).toBe(1);
  });

  test('reads a positive integer, wherever it sits in the query', () => {
    expect(parsePage('?page=3')).toBe(3);
    expect(parsePage('?other=1&page=2')).toBe(2);
  });
});

describe('pageCount', () => {
  test('is at least 1 and rounds a partial page up', () => {
    expect(pageCount(0, 10)).toBe(1);
    expect(pageCount(10, 10)).toBe(1);
    expect(pageCount(11, 10)).toBe(2);
  });

  test('stops at the last page the offset cap can reach', () => {
    expect(pageCount(100_010, 10)).toBe(10001);
    expect(pageCount(100_011, 10)).toBe(10001);
    expect(pageOffset(10001, 10)).toBe(MAX_OFFSET);
  });
});

describe('pageOffset', () => {
  test('skips the pages before, capped at what the API accepts', () => {
    expect(pageOffset(1, 10)).toBe(0);
    expect(pageOffset(3, 10)).toBe(20);
    expect(pageOffset(99_999_999, 10)).toBe(MAX_OFFSET);
  });
});

describe('pagePath', () => {
  test('page 1 is the bare path, any other carries ?page=', () => {
    expect(pagePath('/workouts', 1)).toBe('/workouts');
    expect(pagePath('/workouts', 2)).toBe('/workouts?page=2');
  });
});

describe('pageItems', () => {
  test.each([
    [1, 1, [1]],
    [2, 3, [1, 2, 3]],
    [3, 12, [1, 2, 3, 4, 'gap', 12]],
    [5, 12, [1, 'gap', 4, 5, 6, 'gap', 12]],
    [12, 12, [1, 'gap', 11, 12]],
  ] as const)('page %p of %p', (page, pages, expected) => {
    expect(pageItems(page, pages)).toEqual([...expected]);
  });
});
