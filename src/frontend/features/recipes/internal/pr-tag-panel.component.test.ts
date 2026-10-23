import { beforeAll, expect, test } from 'bun:test';
import { collect, find, mount, shadow, testId, type, useDom } from '../../../testing.ts';
import { tag } from '../recipes.fixtures.ts';
import type { PrTagPanelComponent } from './pr-tag-panel.component.ts';
import { matchesFilter } from './tag-filter.ts';

useDom();

beforeAll(async () => {
  await import('./pr-tag-panel.component.ts');
});

const TAGS = [
  tag({ id: 1, title: 'Pasta', recipeCount: 12 }),
  tag({ id: 2, title: 'Vegetarian', recipeCount: 7 }),
  tag({ id: 3, title: 'Soup', recipeCount: 0 }),
];

function panel(selected: number[] = [], open = true): ShadowRoot {
  const element = mount<PrTagPanelComponent>('pr-tag-panel');
  element.state = { tags: TAGS, selected, open };
  return shadow(element);
}

function button(root: ShadowRoot, id: number): HTMLButtonElement {
  return find<HTMLButtonElement>(root, testId(`tag-${id}`));
}

test('lists each tag with its count, pressed when selected', () => {
  const root = panel([2]);
  expect(button(root, 1).textContent.replaceAll(/\s+/g, ' ').trim()).toBe('Pasta 12');
  expect(button(root, 1).getAttribute('aria-pressed')).toBe('false');
  expect(button(root, 2).getAttribute('aria-pressed')).toBe('true');
  expect(find(root, testId('summary')).textContent).toBe('Tags (1 selected)');
});

test('disables a tag without recipes unless it is selected', () => {
  expect(button(panel(), 3).disabled).toBe(true);
  expect(button(panel([3]), 3).disabled).toBe(false);
});

test('emits the toggled tag and a clear', () => {
  const toggles = collect('tag-toggle');
  const clears = collect('tags-clear');
  const root = panel([1]);
  button(root, 2).click();
  find<HTMLButtonElement>(root, testId('clear')).click();
  expect(toggles).toEqual([2]);
  expect(clears).toHaveLength(1);
});

test('disables Clear without a selection', () => {
  expect(find<HTMLButtonElement>(panel(), testId('clear')).disabled).toBe(true);
});

test('hides tags unlike the filter text, but never a selected one', () => {
  const root = panel([2]);
  type(find<HTMLInputElement>(root, testId('filter')), 'past');
  expect(button(root, 1).hidden).toBe(false);
  expect(button(root, 2).hidden).toBe(false);
  expect(button(root, 3).hidden).toBe(true);
});

test('keeps the filter text when handed new tags', () => {
  const element = mount<PrTagPanelComponent>('pr-tag-panel');
  element.state = { tags: TAGS, selected: [], open: true };
  type(find<HTMLInputElement>(shadow(element), testId('filter')), 'soup');
  element.state = { tags: TAGS, selected: [1], open: true };
  expect(find<HTMLInputElement>(shadow(element), testId('filter')).value).toBe('soup');
  expect(button(shadow(element), 2).hidden).toBe(true);
});

test('emits when the panel opens', () => {
  const opened = collect('tags-open');
  const root = panel([], false);
  const details = find<HTMLDetailsElement>(root, testId('details'));
  details.open = true;
  details.dispatchEvent(new Event('toggle'));
  expect(opened).toEqual([true]);
});

test('says so when there are no tags', () => {
  const element = mount<PrTagPanelComponent>('pr-tag-panel');
  element.state = { tags: [], selected: [], open: true };
  expect(find(shadow(element), testId('no-tags')).textContent).toBe('No tags yet.');
});

test.each<[string, string, boolean]>([
  ['Pasta', '', true],
  ['Pasta', 'pasta', true],
  ['Pasta', 'Past', true],
  ['Vegetarian', 'vege', true],
  ['Soup', 'pasta', false],
])('matchesFilter(%p, %p) is %p', (title, filter, expected) => {
  expect(matchesFilter(title, filter)).toBe(expected);
});
