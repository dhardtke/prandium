import { beforeAll, expect, test } from 'bun:test';
import { embedAuthStatus, find, mount, settle, shadow, testId, useDom, useFetch } from '../testing.ts';

useDom();
const fake = useFetch();

beforeAll(async () => {
  await import('./pr-header.component.ts');
});

// happy-dom has no ToggleEvent, so a plain event carries `newState`.
function open(root: ShadowRoot): void {
  find(root, testId('menu')).dispatchEvent(Object.assign(new Event('toggle'), { newState: 'open' }));
}

test('leaves focus alone when no menu item is the current page', () => {
  history.replaceState(null, '', '/nowhere');
  const root = shadow(mount('pr-header'));
  open(root);
  expect(root.activeElement).toBeNull();
});

test('shows only the brand, the language switch and the theme toggle on the login page', () => {
  history.replaceState(null, '', '/login');
  expect(find(shadow(mount('pr-header')), testId('nav')).classList.contains('login')).toBe(true);
});

test('elsewhere, ends both link lists with Log out, shown while the server asks for a login', () => {
  history.replaceState(null, '', '/recipes/1');
  embedAuthStatus(true);
  const root = shadow(mount('pr-header'));
  expect(find(root, testId('nav')).classList.contains('login')).toBe(false);
  expect(find(root, testId('nav')).classList.contains('auth')).toBe(true);
  expect(find(root, testId('links')).lastElementChild?.textContent).toBe('Log out');
  expect(find(root, testId('menu')).lastElementChild?.textContent).toBe('Log out');
});

test('hides Log out while the server asks for no login', () => {
  history.replaceState(null, '', '/recipes/1');
  embedAuthStatus(false);
  const root = shadow(mount('pr-header'));
  expect(find(root, testId('nav')).classList.contains('auth')).toBe(false);
});

test.each(['links-logout', 'menu-logout'])('Log out from %s logs out and lands on the login page', async (id) => {
  history.replaceState(null, '', '/recipes/1');
  fake.respondTo('POST /api/auth/logout', 204);
  const root = shadow(mount('pr-header'));
  find<HTMLAnchorElement>(root, testId(id)).click();
  await settle();
  expect(fake.sent('POST /api/auth/logout')).toHaveLength(1);
  expect(location.pathname).toBe('/login');
});

test('names Log out in German once the language changes', async () => {
  const { setLanguage } = await import('../ui/i18n.ts');
  embedAuthStatus(true);
  const root = shadow(mount('pr-header'));
  setLanguage('de');
  expect(find(root, testId('links-logout')).textContent).toBe('Abmelden');
});
