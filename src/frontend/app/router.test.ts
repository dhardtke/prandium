import { beforeEach, describe, expect, test } from 'bun:test';
import { useGlobals } from '../testing.ts';
import { currentPath, isActive, linkPath, matchRoute, navigate, onRouteChange } from './router.ts';
import type { LinkClick, LinkTarget, RouteDef } from './router.ts';

const stub = useGlobals();

let pushes: number;
let popStates: number;
let events: EventTarget;

beforeEach(() => {
  pushes = 0;
  popStates = 0;
  events = new EventTarget();
  const fakeLocation = { pathname: '/', search: '', origin: 'http://cena.test' };
  stub('location', fakeLocation);
  stub('history', {
    pushState(_state: unknown, _title: string, url: string): void {
      pushes++;
      const { pathname, search } = new URL(url, fakeLocation.origin);
      fakeLocation.pathname = pathname;
      fakeLocation.search = search;
    },
  });
  stub('window', events);
  stub('PopStateEvent', class extends Event {});
  events.addEventListener('popstate', () => {
    popStates++;
  });
});

const view = (): Promise<Element> => Promise.reject(new Error('never rendered'));

describe('matchRoute', () => {
  const routes: RouteDef[] = [
    { pattern: /^\/a\/(\d+)\/b\/(\w+)$/, keys: ['id', 'slug'], view },
    { pattern: /^\/a\/.*$/, keys: [], view },
  ];

  test('names each capture group by its key, in order', () => {
    expect(matchRoute(routes, '/a/1/b/x')?.params).toEqual({ id: '1', slug: 'x' });
  });

  test('the first matching route wins', () => {
    expect(matchRoute(routes, '/a/1/b/x')?.route).toBe(routes[0]);
    expect(matchRoute(routes, '/a/else')?.route).toBe(routes[1]);
  });

  test('a key whose group did not participate is empty rather than undefined', () => {
    const optional: RouteDef[] = [{ pattern: /^\/c(?:\/(\d+))?$/, keys: ['id'], view }];

    expect(matchRoute(optional, '/c')?.params).toEqual({ id: '' });
  });
});

describe('currentPath', () => {
  test('is the location pathname', () => {
    location.pathname = '/recipes/3';

    expect(currentPath()).toBe('/recipes/3');
  });
});

describe('isActive', () => {
  test('/ is active only on the dashboard itself, not under every route', () => {
    location.pathname = '/';
    expect(isActive('/')).toBe(true);

    location.pathname = '/recipes';
    expect(isActive('/')).toBe(false);
  });

  test('a section stays active on its detail pages', () => {
    location.pathname = '/recipes/3';

    expect(isActive('/recipes')).toBe(true);
    expect(isActive('/tags')).toBe(false);
  });
});

describe('navigate', () => {
  test('to another route pushes that path once and dispatches popstate once', () => {
    navigate('/recipes');

    expect(location.pathname).toBe('/recipes');
    expect(pushes).toBe(1);
    expect(popStates).toBe(1);
  });

  test('to the current route pushes nothing but still dispatches popstate, so the view refreshes', () => {
    location.pathname = '/recipes';

    navigate('/recipes');

    expect(pushes).toBe(0);
    expect(popStates).toBe(1);
  });

  test('from a query to the bare path pushes once and drops the query', () => {
    location.pathname = '/recipes';
    location.search = '?page=2';

    navigate('/recipes');

    expect(location.pathname).toBe('/recipes');
    expect(location.search).toBe('');
    expect(pushes).toBe(1);
  });

  test('to the current path and query pushes nothing but still dispatches popstate', () => {
    location.pathname = '/recipes';
    location.search = '?page=2';

    navigate('/recipes?page=2');

    expect(pushes).toBe(0);
    expect(popStates).toBe(1);
  });

  test('a popstate the browser fires on Back or Forward reaches onRouteChange', () => {
    let heard = 0;
    onRouteChange(() => {
      heard++;
    });

    events.dispatchEvent(new Event('popstate'));

    expect(heard).toBe(1);
  });

  test('onRouteChange returns a function that stops listening', () => {
    let heard = 0;
    const stop = onRouteChange(() => {
      heard++;
    });

    navigate('/recipes');
    stop();
    navigate('/recipes');

    expect(heard).toBe(1);
  });
});

describe('linkPath', () => {
  const origin = 'http://cena.test';
  const click: LinkClick = {
    button: 0,
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    altKey: false,
    defaultPrevented: false,
  };
  const link: LinkTarget = { href: `${origin}/recipes/3`, target: '', download: false };

  test('a plain left click on an in-app link routes to its path', () => {
    expect(linkPath(click, link, origin)).toBe('/recipes/3');
    expect(linkPath(click, { ...link, href: `${origin}/` }, origin)).toBe('/');
  });

  test.each(['ctrlKey', 'metaKey', 'shiftKey', 'altKey'] as const)('%s leaves it to the browser', (key) => {
    expect(linkPath({ ...click, [key]: true }, link, origin)).toBeNull();
  });

  test('a non-primary button or an already prevented click leaves it to the browser', () => {
    expect(linkPath({ ...click, button: 1 }, link, origin)).toBeNull();
    expect(linkPath({ ...click, defaultPrevented: true }, link, origin)).toBeNull();
  });

  test('a target other than _self, or download, leaves it to the browser', () => {
    expect(linkPath(click, { ...link, target: '_blank' }, origin)).toBeNull();
    expect(linkPath(click, { ...link, target: '_self' }, origin)).toBe('/recipes/3');
    expect(linkPath(click, { ...link, download: true }, origin)).toBeNull();
  });

  test('another origin leaves it to the browser', () => {
    expect(linkPath(click, { ...link, href: 'http://elsewhere.test/recipes/3' }, origin)).toBeNull();
  });

  test('the API is not a route, though a path merely starting with api is', () => {
    expect(linkPath(click, { ...link, href: `${origin}/api` }, origin)).toBeNull();
    expect(linkPath(click, { ...link, href: `${origin}/api/health` }, origin)).toBeNull();
    expect(linkPath(click, { ...link, href: `${origin}/apiary` }, origin)).toBe('/apiary');
  });

  test('a file leaves it to the browser', () => {
    expect(linkPath(click, { ...link, href: `${origin}/vendor/oat.css` }, origin)).toBeNull();
  });

  test('a query string or a fragment leaves it to the browser', () => {
    expect(linkPath(click, { ...link, href: `${origin}/recipes?x=1` }, origin)).toBeNull();
    expect(linkPath(click, { ...link, href: `${origin}/recipes#top` }, origin)).toBeNull();
  });
});
