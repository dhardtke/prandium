import { beforeAll, beforeEach, expect, test } from 'bun:test';
import { find, mount, openDialog, settle, shadow, testId, useDom, useFetch } from '../testing.ts';
import type * as I18n from '../ui/i18n.ts';
import type * as LeaveGuard from '../ui/leave-guard.ts';
import { navigate } from './router.ts';
import { APP_TITLE } from './tab-title.ts';

useDom();
const fake = useFetch();

let setLanguage: typeof I18n.setLanguage;
let guardLeave: typeof LeaveGuard.guardLeave;

beforeAll(async () => {
  await import('./pr-app.component.ts');
  ({ setLanguage } = await import('../ui/i18n.ts'));
  ({ guardLeave } = await import('../ui/leave-guard.ts'));
  await import('../ui/confirm/pr-confirm-dialog.component.ts');
  if (!customElements.get('pr-test-link')) {
    class PrTestLink extends HTMLElement {
      readonly #anchor = document.createElement('a');

      constructor() {
        super();
        this.#anchor.dataset.testid = 'link';
        this.attachShadow({ mode: 'open' }).append(this.#anchor);
      }

      connectedCallback(): void {
        for (const name of ['href', 'target', 'download']) {
          const value = this.getAttribute(name);
          if (value !== null) {
            this.#anchor.setAttribute(name, value);
          }
        }
      }
    }
    customElements.define('pr-test-link', PrTestLink);
  }
});

beforeEach(() => {
  history.replaceState(null, '', '/nowhere');
  // happy-dom keeps the <title> a test wrote in <head>, which useDom() does not clear.
  document.title = APP_TITLE;
});

async function mountApp(): Promise<HTMLElement> {
  const app = mount('pr-app');
  await settle(0);
  return app;
}

function notFound(app: HTMLElement): string | undefined {
  return app.querySelector(`:scope > ${testId('not-found')}`)?.textContent;
}

function link(app: HTMLElement, attributes: Record<string, string>): HTMLAnchorElement {
  const host = document.createElement('pr-test-link');
  for (const [name, value] of Object.entries(attributes)) {
    host.setAttribute(name, value);
  }
  app.append(host);
  return find<HTMLAnchorElement>(shadow(host), testId('link'));
}

function click(anchor: HTMLAnchorElement, init: MouseEventInit = {}): boolean {
  const event = new MouseEvent('click', { bubbles: true, composed: true, cancelable: true, ...init });
  anchor.dispatchEvent(event);
  return event.defaultPrevented;
}

test('renders the header, and the view for the current path in its light DOM', async () => {
  const app = await mountApp();
  expect(notFound(app)).toBe('Nothing lives at /nowhere.');
  expect(app.shadowRoot?.querySelector(testId('view-slot'))).not.toBeNull();
  expect(app.shadowRoot?.querySelector(testId('header'))?.shadowRoot?.querySelector(testId('nav'))).not.toBeNull();
});

test('routes a plain click on a link inside a shadow root, keeping the header', async () => {
  const app = await mountApp();
  const header = app.shadowRoot?.querySelector(testId('header'));
  expect(click(link(app, { href: '/elsewhere' }))).toBe(true);
  await settle(0);
  expect(location.pathname).toBe('/elsewhere');
  expect(notFound(app)).toBe('Nothing lives at /elsewhere.');
  expect(app.shadowRoot?.querySelector(testId('header'))).toBe(header ?? null);
});

test.each<[string, Record<string, string>, MouseEventInit]>([
  ['a Ctrl click', { href: '/elsewhere' }, { ctrlKey: true }],
  ['a Meta click', { href: '/elsewhere' }, { metaKey: true }],
  ['a Shift click', { href: '/elsewhere' }, { shiftKey: true }],
  ['an Alt click', { href: '/elsewhere' }, { altKey: true }],
  ['a middle-button click', { href: '/elsewhere' }, { button: 1 }],
  ['a link with a target', { href: '/elsewhere', target: '_blank' }, {}],
  ['a download link', { href: '/elsewhere', download: '' }, {}],
  ['a link to the API', { href: '/api/recipes' }, {}],
  ['a link with a query', { href: '/elsewhere?x=1' }, {}],
  ['a link to a file', { href: '/file.txt' }, {}],
])('leaves %s to the browser', async (_name, attributes, init) => {
  const app = await mountApp();
  expect(click(link(app, attributes), init)).toBe(false);
  await settle(0);
  expect(location.pathname).toBe('/nowhere');
  expect(notFound(app)).toBe('Nothing lives at /nowhere.');
});

test('re-renders on navigate()', async () => {
  const app = await mountApp();
  navigate('/somewhere');
  await settle(0);
  expect(notFound(app)).toBe('Nothing lives at /somewhere.');
});

test('re-renders on popstate, as the browser fires on Back', async () => {
  const app = await mountApp();
  history.replaceState(null, '', '/back-here');
  window.dispatchEvent(new PopStateEvent('popstate'));
  await settle(0);
  expect(notFound(app)).toBe('Nothing lives at /back-here.');
});

test('stops listening once removed, and renders the current path when mounted again', async () => {
  await mountApp();
  document.body.replaceChildren();
  history.replaceState(null, '', '/later');
  expect(() => window.dispatchEvent(new PopStateEvent('popstate'))).not.toThrow();
  await settle(0);
  expect(notFound(await mountApp())).toBe('Nothing lives at /later.');
});

test('sends a 401 to the login page, remembering where it came from', async () => {
  const app = await mountApp();
  history.replaceState(null, '', '/recipes?page=2');
  window.dispatchEvent(new Event('pr:unauthorized'));
  expect(location.pathname + location.search).toBe('/login?next=%2Frecipes%3Fpage%3D2');
  // The login module and auth status must land before the DOM is torn down.
  for (let i = 0; i < 50 && !app.querySelector(':scope > pr-login'); i++) {
    await settle();
  }
  const login = app.querySelector(':scope > pr-login');
  expect(login?.hasAttribute('hidden')).toBe(false);
  expect(login?.querySelector(testId('password'))).not.toBeNull();
});

test('ignores a 401 on the login page itself', async () => {
  const app = await mountApp();
  history.replaceState(null, '', '/login?next=%2Fx');
  window.dispatchEvent(new Event('pr:unauthorized'));
  await settle(0);
  expect(notFound(app)).toBe('Nothing lives at /nowhere.');
  expect(location.pathname + location.search).toBe('/login?next=%2Fx');
});

async function shown(app: HTMLElement, tag: string): Promise<HTMLElement | null> {
  for (let i = 0; i < 50 && !app.querySelector(`:scope > ${tag}:not([hidden])`); i++) {
    await settle();
  }
  return app.querySelector<HTMLElement>(`:scope > ${tag}:not([hidden])`);
}

function breadcrumbs(app: HTMLElement): HTMLElement {
  return find<HTMLElement>(shadow(app), testId('breadcrumbs'));
}

function trail(app: HTMLElement): string[] | null {
  const element = breadcrumbs(app);
  if (element.hasAttribute('hidden')) {
    return null;
  }
  const root = shadow(element);
  const crumbs = Array.from(root.querySelectorAll(testId('crumb'))).map((crumb) => `${crumb.textContent} → ${crumb.getAttribute('href')}`);
  return [...crumbs, root.querySelector(testId('current'))?.textContent ?? ''];
}

test('names a path no route matches "Not found" in the tab, with no breadcrumb', async () => {
  const app = await mountApp();
  expect(document.title).toBe('Not Found · Prandium');
  expect(trail(app)).toBeNull();
});

test('names the login page in the tab, with no breadcrumb', async () => {
  const app = await mountApp();
  navigate('/login');
  expect(await shown(app, 'pr-login')).not.toBeNull();
  expect(document.title).toBe('Log in · Prandium');
  expect(trail(app)).toBeNull();
});

test('follows a language change in the tab title and the not-found view, keeping the view', async () => {
  const app = await mountApp();
  const view = app.querySelector(`:scope > ${testId('not-found')}`);
  setLanguage('de');
  expect(document.title).toBe('Nicht gefunden · Prandium');
  expect(notFound(app)).toBe('Unter /nowhere gibt es nichts.');
  expect(app.querySelector(`:scope > ${testId('not-found')}`)).toBe(view);
});

test('names the login page in German once the language changes', async () => {
  const app = await mountApp();
  navigate('/login');
  expect(await shown(app, 'pr-login')).not.toBeNull();
  setLanguage('de');
  expect(document.title).toBe('Anmelden · Prandium');
});

async function openRecipe(status = 200, body = JSON.stringify({ ...RECIPE })): Promise<HTMLElement> {
  fake.respondTo('GET /api/recipes/12', status, body);
  history.replaceState(null, '', '/recipes/12');
  const app = await mountApp();
  await shown(app, 'pr-recipe-detail');
  return app;
}

const RECIPE = {
  id: 12,
  title: 'Carbonara',
  flagged: false,
  description: '',
  source: '',
  thumbnail: null,
  yield: 4,
  nutrition: {},
  prepTime: 0,
  cookTime: 0,
  totalTime: 0,
  aggregateRating: { value: null, count: null },
  rating: 0,
  ingredients: [],
  instructions: [],
  history: [],
  reviews: [],
  tags: [],
  createdAt: '2026-10-01T10:00:00.000Z',
  updatedAt: '2026-10-01T10:00:00.000Z',
};

test('shows a recipe below its list in the breadcrumb, and its title in the tab', async () => {
  const app = await openRecipe();
  expect(trail(app)).toEqual(['Recipes → /', 'Carbonara']);
  expect(document.title).toBe('Carbonara · Prandium');
});

test("falls back to the route's title for a recipe that cannot be loaded", async () => {
  const app = await openRecipe(404, JSON.stringify({ error: 'Recipe not found' }));
  expect(trail(app)).toEqual(['Recipes → /', 'Recipe']);
  expect(document.title).toBe('Recipe · Prandium');
});

test('renders the breadcrumb in German once the language changes', async () => {
  const app = await openRecipe(404, JSON.stringify({ error: 'Recipe not found' }));
  setLanguage('de');
  expect(trail(app)).toEqual(['Rezepte → /', 'Rezept']);
  expect(document.title).toBe('Rezept · Prandium');
});

test('asks before following a link away from unsaved changes, and stays when declined', async () => {
  const app = await mountApp();
  const release = guardLeave(() => true);
  try {
    click(link(app, { href: '/elsewhere' }));
    find<HTMLButtonElement>(openDialog(), testId('cancel')).click();
    await settle();
    expect(location.pathname).toBe('/nowhere');
    click(link(app, { href: '/elsewhere' }));
    find<HTMLButtonElement>(openDialog(), testId('confirm')).click();
    await settle();
    expect(location.pathname).toBe('/elsewhere');
  } finally {
    release();
  }
});

test('puts the URL back when Back is declined', async () => {
  const app = await mountApp();
  const release = guardLeave(() => true);
  try {
    history.pushState(null, '', '/back-here');
    window.dispatchEvent(new PopStateEvent('popstate'));
    find<HTMLButtonElement>(openDialog(), testId('cancel')).click();
    await settle();
    expect(location.pathname).toBe('/nowhere');
    expect(notFound(app)).toBe('Nothing lives at /nowhere.');
  } finally {
    release();
  }
});
