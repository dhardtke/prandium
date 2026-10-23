import { describe, expect, test } from 'bun:test';
import { RECIPE_SORT_KEYS as BACKEND_SORT_KEYS } from '../../../../backend/features/recipes/recipes.facade.ts';
import { type ListQuery, listPath, parseListQuery, RECIPE_SORT_KEYS } from './list-query.ts';

const DEFAULTS: ListQuery = { search: '', tags: [], sort: 'title', order: 'asc', page: 1, tagsOpen: false };

describe('parseListQuery', () => {
  test('defaults an empty query', () => {
    expect(parseListQuery('')).toEqual(DEFAULTS);
  });

  test('reads every field', () => {
    expect(parseListQuery('?search=%20pasta%20&tag=3&tag=1&tag=3&sort=rating&order=desc&page=2&tags')).toEqual({
      search: 'pasta',
      tags: [3, 1],
      sort: 'rating',
      order: 'desc',
      page: 2,
      tagsOpen: true,
    });
  });

  test("reads the old app's names", () => {
    expect(parseListQuery('?title=pasta&tagId=3&orderBy=rating&order=DESC&tagFilter=')).toEqual({
      search: 'pasta',
      tags: [3],
      sort: 'rating',
      order: 'desc',
      page: 1,
      tagsOpen: true,
    });
  });

  test('maps the broken saturated-fat sort of the old app', () => {
    expect(parseListQuery('?orderBy=nutrition_saturatedFat').sort).toBe('nutrition_saturated_fat');
  });

  test.each(['?sort=nope', '?page=0', '?page=x', '?tag=abc', '?order=sideways', `?search=${'x'.repeat(501)}`])('falls back to a default for %p', (query) => {
    expect(parseListQuery(query)).toEqual(DEFAULTS);
  });
});

describe('listPath', () => {
  test('is the bare root for the defaults', () => {
    expect(listPath(DEFAULTS)).toBe('/');
  });

  test('writes the canonical names, so a pushState rewrites the old ones', () => {
    expect(listPath(parseListQuery('?title=pasta&tagId=3&orderBy=rating&order=DESC&tagFilter='))).toBe('/?search=pasta&tag=3&sort=rating&order=desc&tags');
  });

  test('round-trips through parseListQuery', () => {
    const query: ListQuery = { search: 'a & b', tags: [1, 2], sort: 'total_time', order: 'desc', page: 3, tagsOpen: false };
    expect(parseListQuery(listPath(query).slice(1))).toEqual(query);
  });
});

test('the sort keys match the backend allowlist', () => {
  expect([...RECIPE_SORT_KEYS]).toEqual([...BACKEND_SORT_KEYS]);
});
