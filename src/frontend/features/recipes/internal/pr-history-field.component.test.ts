import { beforeAll, expect, test } from 'bun:test';
import { find, mount, shadow, testId, useDom } from '../../../testing.ts';
import { fromLocalParts, toLocalParts } from './history-time.ts';
import type { PrHistoryFieldComponent } from './pr-history-field.component.ts';

useDom();

beforeAll(async () => {
  await import('./pr-history-field.component.ts');
});

function field(entries: string[]): PrHistoryFieldComponent {
  const element = mount<PrHistoryFieldComponent>('pr-history-field', { label: 'History' });
  element.value = entries;
  return element;
}

test('local parts round-trip to the same moment', () => {
  const iso = '2026-10-20T18:30:00.000Z';
  const { date, time } = toLocalParts(iso);
  expect(fromLocalParts(date, time)).toBe(iso);
});

test('fromLocalParts refuses a missing date and takes midnight for a missing time', () => {
  expect(fromLocalParts('', '10:00')).toBeNull();
  expect(fromLocalParts('2026-10-20', '')).toBe(new Date('2026-10-20T00:00').toISOString());
});

test('keeps untouched entries exactly, seconds included, newest first', () => {
  const element = field(['2021-04-01T18:00:37.123Z', '2021-05-02T17:30:00.000Z']);
  expect(element.value).toEqual(['2021-05-02T17:30:00.000Z', '2021-04-01T18:00:37.123Z']);
});

test('writes an edited entry from its inputs', () => {
  const element = field(['2021-04-01T18:00:37.123Z']);
  const date = find<HTMLInputElement>(shadow(element), testId('date-0'));
  date.value = '2021-04-03';
  date.dispatchEvent(new Event('input', { bubbles: true }));
  expect(element.value).toEqual([fromLocalParts('2021-04-03', toLocalParts('2021-04-01T18:00:37.123Z').time) ?? '']);
});

test('adds an entry for now and removes one', () => {
  const element = field(['2021-04-01T18:00:00.000Z']);
  find<HTMLButtonElement>(shadow(element), testId('add')).click();
  expect(element.value).toHaveLength(2);
  expect(Date.now() - Date.parse(element.value[0] ?? '')).toBeLessThan(2 * 60 * 1000);
  find<HTMLButtonElement>(shadow(element), '[data-action="remove"][data-index="0"]').click();
  expect(element.value).toEqual(['2021-04-01T18:00:00.000Z']);
});
