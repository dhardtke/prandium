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

  test('/recipes/:id is a recipe below the list, capturing the id', () => {
    const detail = matchRoute(ROUTES, '/recipes/12');
    expect(detail?.params).toEqual({ id: '12' });
    expect(detail?.route.title?.(en)).toBe('Recipe');
    expect(detail?.route.parents?.map((parent) => [parent.path, parent.label(en)])).toEqual([['/', 'Recipes']]);
    expect(matchRoute(ROUTES, '/recipes/12/')?.route).toBe(detail?.route);
  });

  test('/recipes/new and /recipes/:id/edit open the form, below the list', () => {
    const create = matchRoute(ROUTES, '/recipes/new');
    const edit = matchRoute(ROUTES, '/recipes/12/edit');
    expect(create?.route.title?.(en)).toBe('New recipe');
    expect(edit?.params).toEqual({ id: '12' });
    expect(edit?.route.title?.(en)).toBe('Edit');
    expect(create?.route).not.toBe(matchRoute(ROUTES, '/recipes/12')?.route);
  });

  test.each(['/nope', '/login/extra', '/recipes', '/recipes/abc', '/recipes/12/extra'])('%s matches nothing', (path) => {
    expect(matchRoute(ROUTES, path)).toBeNull();
  });

  test("every parent links to a route titled by the parent's label", () => {
    for (const parent of ROUTES.flatMap((route) => route.parents ?? [])) {
      expect(matchRoute(ROUTES, parent.path)?.route.title?.(en)).toBe(parent.label(en));
    }
  });
});
