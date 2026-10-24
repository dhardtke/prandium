import { beforeAll, expect, test } from 'bun:test';
import { find, mount, shadow, testId, useDom } from '../testing.ts';
import type { CeBreadcrumbsComponent } from './ce-breadcrumbs.component.ts';

useDom();

beforeAll(async () => {
  await import('./ce-breadcrumbs.component.ts');
});

const TRAIL = { parents: [{ path: '/recipes', label: 'Recipes' }], current: 'Carbonara' };

test('starts hidden, with no trail rendered', () => {
  const breadcrumbs = mount<CeBreadcrumbsComponent>('ce-breadcrumbs');
  expect(breadcrumbs.hidden).toBe(true);
  expect(shadow(breadcrumbs).querySelector(testId('breadcrumb'))).toBeNull();
});

test('shows a trail: the parents as links, the current page as text', () => {
  const breadcrumbs = mount<CeBreadcrumbsComponent>('ce-breadcrumbs');
  breadcrumbs.trail = TRAIL;
  const root = shadow(breadcrumbs);

  expect(breadcrumbs.hidden).toBe(false);
  expect(find(root, testId('breadcrumb')).getAttribute('aria-label')).toBe('Breadcrumb');
  const crumbs = Array.from(root.querySelectorAll(testId('crumb')));
  expect(crumbs.map((crumb) => [crumb.textContent, crumb.getAttribute('href')])).toEqual([['Recipes', '/recipes']]);
  const current = find(root, testId('current'));
  expect(current.textContent).toBe('Carbonara');
  expect(current.getAttribute('aria-current')).toBe('page');
  expect(current).not.toBeInstanceOf(HTMLAnchorElement);
});

test('keeps a trail set before it is connected', async () => {
  const { CeBreadcrumbsComponent: Breadcrumbs } = await import('./ce-breadcrumbs.component.ts');
  const breadcrumbs = new Breadcrumbs();
  breadcrumbs.trail = TRAIL;
  document.body.append(breadcrumbs);
  expect(breadcrumbs.hidden).toBe(false);
  expect(find(shadow(breadcrumbs), testId('current')).textContent).toBe('Carbonara');
});

test('escapes the labels', () => {
  const breadcrumbs = mount<CeBreadcrumbsComponent>('ce-breadcrumbs');
  breadcrumbs.trail = { parents: [{ path: '/recipes', label: '<b>Recipes</b>' }], current: '<b>Ramen</b>' };
  const root = shadow(breadcrumbs);
  expect(root.querySelector('b')).toBeNull();
  expect(find(root, testId('current')).textContent).toBe('<b>Ramen</b>');
});

test('hides again once the trail is cleared', () => {
  const breadcrumbs = mount<CeBreadcrumbsComponent>('ce-breadcrumbs');
  breadcrumbs.trail = TRAIL;
  breadcrumbs.trail = null;
  expect(breadcrumbs.hidden).toBe(true);
  expect(shadow(breadcrumbs).querySelector(testId('breadcrumb'))).toBeNull();
});
