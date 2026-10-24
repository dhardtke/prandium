import { beforeAll, expect, test } from 'bun:test';
import { find, mount, shadow, testId, type, useDom } from '../../../testing.ts';
import type { CeListFieldComponent } from './ce-list-field.component.ts';

useDom();

beforeAll(async () => {
  await import('./ce-list-field.component.ts');
});

function field(items: string[], attributes: Record<string, string> = {}): CeListFieldComponent {
  const element = mount<CeListFieldComponent>('ce-list-field', { label: 'Ingredients', 'add-label': 'Add ingredient', ...attributes });
  element.value = items;
  return element;
}

function click(element: CeListFieldComponent, action: string, index?: number): void {
  const selector = index === undefined ? `[data-action="${action}"]` : `[data-action="${action}"][data-index="${index}"]`;
  find<HTMLButtonElement>(shadow(element), selector).click();
}

test('shows one input per line and reads them back', () => {
  const element = field(['Salt', 'Pepper']);
  expect(shadow(element).querySelectorAll('input')).toHaveLength(2);
  expect(element.value).toEqual(['Salt', 'Pepper']);
});

test('uses textareas when multiline', () => {
  expect(shadow(field(['Boil.'], { multiline: '' })).querySelectorAll('textarea')).toHaveLength(1);
});

test('adds, removes and moves lines, keeping what was typed, and emits input', () => {
  const element = field(['Salt', 'Pepper']);
  let inputs = 0;
  element.addEventListener('input', () => {
    inputs++;
  });
  type(find<HTMLInputElement>(shadow(element), testId('field-0')), 'Sea salt');
  click(element, 'add');
  expect(element.value).toEqual(['Sea salt', 'Pepper', '']);
  click(element, 'down', 0);
  expect(element.value).toEqual(['Pepper', 'Sea salt', '']);
  click(element, 'up', 2);
  expect(element.value).toEqual(['Pepper', '', 'Sea salt']);
  click(element, 'remove', 1);
  expect(element.value).toEqual(['Pepper', 'Sea salt']);
  expect(inputs).toBe(5);
});

test('disables up on the first line and down on the last', () => {
  const root = shadow(field(['a', 'b']));
  expect(find<HTMLButtonElement>(root, '[data-action="up"][data-index="0"]').disabled).toBe(true);
  expect(find<HTMLButtonElement>(root, '[data-action="down"][data-index="1"]').disabled).toBe(true);
});

test('focuses a line it adds', () => {
  const element = field([]);
  click(element, 'add');
  expect(shadow(element).activeElement).toBe(find(shadow(element), testId('field-0')));
});
