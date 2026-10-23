import { expect, test } from 'bun:test';
import { useDom, useFetch } from '../../testing.ts';
import { recipeFacade } from './recipes.facade.ts';

useDom();
const fake = useFetch();

test('list() sends the page, the filter and the sort', async () => {
  await recipeFacade.list({ limit: 24, offset: 48, search: 'pasta', tags: [3, 1], sort: 'rating', order: 'desc' });
  expect(fake.requests).toMatchObject([{ method: 'GET', url: '/api/recipes?limit=24&offset=48&search=pasta&tag=3&tag=1&sort=rating&order=desc' }]);
});

test('list() leaves out an empty search', async () => {
  await recipeFacade.list({ limit: 24, offset: 0, search: '' });
  expect(fake.requests).toMatchObject([{ url: '/api/recipes?limit=24&offset=0' }]);
});

test('create()', async () => {
  await recipeFacade.create({ title: 'Ramen' });
  expect(fake.requests).toMatchObject([{ method: 'POST', url: '/api/recipes', body: { title: 'Ramen' } }]);
});
