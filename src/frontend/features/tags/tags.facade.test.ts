import { expect, test } from 'bun:test';
import { useDom, useFetch } from '../../testing.ts';
import { tagFacade } from './tags.facade.ts';

useDom();
const fake = useFetch();

test('list() without a selection', async () => {
  await tagFacade.list();
  expect(fake.requests).toMatchObject([{ method: 'GET', url: '/api/tags' }]);
});

test('list() counts among the selected tags', async () => {
  await tagFacade.list([2, 5]);
  expect(fake.requests).toMatchObject([{ method: 'GET', url: '/api/tags?selected=2&selected=5' }]);
});
