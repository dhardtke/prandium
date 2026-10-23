import { beforeAll, expect, test } from 'bun:test';
import { collect, find, mount, shadow, testId, useDom } from '../../../testing.ts';

useDom();

beforeAll(async () => {
  await import('./pr-rating.component.ts');
});

function checked(root: ShadowRoot): string[] {
  return Array.from(root.querySelectorAll<HTMLInputElement>('input:checked')).map((input) => input.value);
}

test('offers ten half-star steps and checks the value rounded to a half', () => {
  const root = shadow(mount('pr-rating', { value: '3.7' }));
  expect(root.querySelectorAll('input[type="radio"]')).toHaveLength(10);
  expect(checked(root)).toEqual(['3.5']);
});

test('checks nothing for 0', () => {
  expect(checked(shadow(mount('pr-rating', { value: '0' })))).toEqual([]);
});

test('emits rating-change with the chosen step', () => {
  const changes = collect('rating-change');
  const root = shadow(mount('pr-rating', { value: '1' }));
  const star = find<HTMLInputElement>(root, testId('star-9'));
  star.checked = true;
  star.dispatchEvent(new Event('change', { bubbles: true }));
  expect(changes).toEqual([4.5]);
});

test('is disabled and silent when readonly', () => {
  const changes = collect('rating-change');
  const root = shadow(mount('pr-rating', { value: '4', readonly: '' }));
  const star = find<HTMLInputElement>(root, testId('star-2'));
  expect(star.disabled).toBe(true);
  star.dispatchEvent(new Event('change', { bubbles: true }));
  expect(changes).toEqual([]);
});

test('follows a new value', () => {
  const element = mount('pr-rating', { value: '1' });
  element.setAttribute('value', '5');
  expect(checked(shadow(element))).toEqual(['5']);
});
