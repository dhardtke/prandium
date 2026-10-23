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

test('get(), update() and delete() address the recipe', async () => {
  await recipeFacade.get(12);
  await recipeFacade.update(12, { flagged: true });
  await recipeFacade.delete(12);
  expect(fake.requests).toMatchObject([
    { method: 'GET', url: '/api/recipes/12' },
    { method: 'PATCH', url: '/api/recipes/12', body: { flagged: true } },
    { method: 'DELETE', url: '/api/recipes/12' },
  ]);
});

test('putThumbnail() sends the image as its own type, deleteThumbnail() removes it', async () => {
  const image = new Blob([new Uint8Array([1])], { type: 'image/png' });
  await recipeFacade.putThumbnail(12, image);
  await recipeFacade.deleteThumbnail(12);
  expect(fake.requests).toMatchObject([
    { method: 'PUT', url: '/api/recipes/12/thumbnail', headers: { 'Content-Type': 'image/png' }, body: image },
    { method: 'DELETE', url: '/api/recipes/12/thumbnail' },
  ]);
});

test('import()', async () => {
  await recipeFacade.import({ urls: ['https://example.com/a'] });
  expect(fake.requests).toMatchObject([{ method: 'POST', url: '/api/recipes/import', body: { urls: ['https://example.com/a'] } }]);
});
