import { expect, test } from 'bun:test';
import { embedAuthStatus, useDom, useFetch } from '../../testing.ts';
import { authFacade } from './auth.facade.ts';

useDom();
const fetch = useFetch();

test('authFacade.enabled() reads the status the server embedded, without a request', () => {
  embedAuthStatus(false);

  expect(authFacade.enabled()).toBe(false);
  expect(fetch.requests).toEqual([]);
});

test('authFacade.enabled() assumes a login without an embedded status', () => {
  expect(authFacade.enabled()).toBe(true);
});

test('authFacade.login()', async () => {
  await authFacade.login('pw');

  expect(fetch.requests).toMatchObject([{ method: 'POST', url: '/api/auth/login', body: { password: 'pw' } }]);
});

test('authFacade.logout()', async () => {
  await authFacade.logout();

  expect(fetch.requests).toMatchObject([{ method: 'POST', url: '/api/auth/logout' }]);
});
