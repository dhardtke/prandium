import { describe, expect, test } from 'bun:test';
import { en } from '../i18n/en.ts';
import { matchRoute } from './router.ts';
import { ROUTES } from './routes.ts';

// Never calls a route's view: it imports a module extending HTMLElement, which bun test lacks.
describe('routes', () => {
  test.each(['/login', '/login/'])('%s matches the login page', (path) => {
    expect(matchRoute(ROUTES, path)?.route.title?.(en)).toBe('Log in');
  });

  test('/ is the recipe list, linked in the header as Recipes', () => {
    const list = matchRoute(ROUTES, '/');
    expect(list?.route.title?.(en)).toBe('Recipes');
    expect(ROUTES.filter((route) => route.nav).map((route) => [route.nav?.path, route.nav?.label(en)])).toEqual([['/', 'Recipes']]);
  });

  test.each(['/nope', '/login/extra', '/recipes'])('%s matches nothing', (path) => {
    expect(matchRoute(ROUTES, path)).toBeNull();
  });

  test("every parent links to a route titled by the parent's label", () => {
    for (const parent of ROUTES.flatMap((route) => route.parents ?? [])) {
      expect(matchRoute(ROUTES, parent.path)?.route.title?.(en)).toBe(parent.label(en));
    }
  });
});
