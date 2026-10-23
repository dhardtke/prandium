import { beforeAll, expect, test } from 'bun:test';
import { embedAuthStatus, find, mount, settle, shadow, submit, testId, type, useDom, useFetch } from '../../testing.ts';

useDom();
const fake = useFetch();

beforeAll(async () => {
  await import('./pr-login.component.ts');
});

async function logIn(password: string): Promise<HTMLElement> {
  const view = mount('pr-login');
  await settle();
  type(find<HTMLInputElement>(view, testId('password')), password);
  submit(find(view, testId('form')));
  await settle();
  return view;
}

function alertText(view: HTMLElement): string | null {
  const alert = find<HTMLElement>(view, testId('alert'));
  return alert.hidden === true ? null : alert.textContent;
}

test('has the form in the light DOM as soon as it connects, where password managers search', async () => {
  history.replaceState(null, '', '/login');
  mount('pr-login');

  expect(document.querySelector(`pr-login > ${testId('form')} ${testId('password')}`)).not.toBeNull();
  await settle();
});

test('posts the password and goes to next', async () => {
  history.replaceState(null, '', '/login?next=%2Fworkouts%2F12');
  fake.respondTo('POST /api/auth/login', 204);

  const view = await logIn('pw');

  expect(fake.sent('POST /api/auth/login')).toEqual([{ password: 'pw' }]);
  expect(location.pathname).toBe('/workouts/12');
  expect(alertText(view)).toBeNull();
});

test('a wrong password says so and stays', async () => {
  history.replaceState(null, '', '/login');
  fake.respondTo('POST /api/auth/login', 401, '{"error":"Wrong password"}');

  const view = await logIn('nope');

  expect(alertText(view)).toBe('Wrong password.');
  expect(location.pathname).toBe('/login');
});

test("a lockout shows the server's message", async () => {
  history.replaceState(null, '', '/login');
  fake.respondTo('POST /api/auth/login', 429, '{"error":"Too many failed logins; try again in 60 s"}');

  const view = await logIn('pw');

  expect(alertText(view)).toBe('Too many failed logins; try again in 60 s');
});

test('without a login on the server, goes straight to next', () => {
  history.replaceState(null, '', '/login?next=%2Fworkouts%2F12');
  embedAuthStatus(false);

  mount('pr-login');

  expect(location.pathname).toBe('/workouts/12');
  expect(fake.sent('POST /api/auth/login')).toEqual([]);
});

test('speaks German once the language changes', async () => {
  const { setLanguage } = await import('../../ui/i18n.ts');
  embedAuthStatus(true);
  setLanguage('de');
  const login = mount('pr-login');
  expect(shadow(login).querySelector('h1')?.textContent).toBe('Anmelden');
  expect(login.querySelector('button[type="submit"]')?.textContent).toBe('Anmelden');
});
