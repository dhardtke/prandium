import { describe, expect, test } from 'bun:test';
import { buildFilters, buildOrderBySql, EMPTY_FILTER, EMPTY_ORDER_BY, likePattern, placeholders } from './sql.ts';

describe('buildFilters', () => {
  test('is TRUE when no filter is active', () => {
    expect(buildFilters()).toEqual(EMPTY_FILTER);
    expect(buildFilters({ active: false, sql: () => '' })).toEqual(EMPTY_FILTER);
  });

  test('ANDs the active filters and their bindings, in order', () => {
    expect(
      buildFilters(
        { active: true, sql: () => '? = TRUE', bindings: () => ['TRUE'] },
        { active: false, sql: () => '? = FALSE', bindings: () => ['FALSE'] },
        { active: true, sql: () => '? < 42', bindings: () => [41] },
        { active: true, sql: () => 'x IS NULL' },
      ),
    ).toEqual({ sql: '? = TRUE AND ? < 42 AND x IS NULL', bindings: ['TRUE', 41] });
  });
});

describe('buildOrderBySql', () => {
  test('orders by nothing without a column or with one not allowed', () => {
    expect(buildOrderBySql(undefined, [])).toBe(EMPTY_ORDER_BY);
    expect(buildOrderBySql({ column: 'title' }, ['id', 'updated_at'])).toBe(EMPTY_ORDER_BY);
    expect(buildOrderBySql({ column: 'title; DROP TABLE recipe', order: 'asc' }, ['title'])).toBe(EMPTY_ORDER_BY);
  });

  test.each<[string | undefined, string]>([
    [undefined, 'ORDER BY title'],
    ['asc', 'ORDER BY title'],
    ['ASC', 'ORDER BY title'],
    ['desc', 'ORDER BY title DESC'],
    ['DESC', 'ORDER BY title DESC'],
    ['', 'ORDER BY title'],
    ['foo', 'ORDER BY title'],
  ])('orders %p as %p', (order, sql) => {
    expect(buildOrderBySql({ column: 'title', order }, ['title'])).toBe(sql);
  });
});

test('placeholders', () => {
  expect(placeholders(0)).toBe('');
  expect(placeholders(3)).toBe('?, ?, ?');
  expect(placeholders([1, 2, 3, 4])).toBe('?, ?, ?, ?');
});

test('likePattern escapes the wildcards', () => {
  expect(likePattern('50%_off\\')).toBe('%50\\%\\_off\\\\%');
});
