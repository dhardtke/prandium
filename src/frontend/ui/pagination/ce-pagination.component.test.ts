import { beforeAll, expect, test } from 'bun:test';
import { collect, find, mount, shadow, testId, useDom } from '../../testing.ts';

useDom();

beforeAll(async () => {
  await import('./ce-pagination.component.ts');
});

function mountPager(page: number, pages: number): HTMLElement {
  return mount('ce-pagination', { page: String(page), pages: String(pages) });
}

function buttons(pager: HTMLElement): HTMLButtonElement[] {
  return Array.from(find(shadow(pager), testId('pager')).querySelectorAll<HTMLButtonElement>('[data-testid]'));
}

function button(pager: HTMLElement, id: string): HTMLButtonElement {
  return find<HTMLButtonElement>(shadow(pager), testId(id));
}

test('shows the pages around the current one, the ends, and gaps between', () => {
  const pager = mountPager(5, 12);
  expect(buttons(pager).map((candidate) => candidate.textContent.trim())).toEqual(['←', '1', '…', '4', '5', '6', '…', '12', '→']);
  expect(
    buttons(pager)
      .filter((candidate) => candidate.dataset.testid === 'gap')
      .every((gap) => gap.disabled),
  ).toBe(true);
  expect(
    buttons(pager)
      .filter((candidate) => candidate.getAttribute('aria-current') === 'page')
      .map((current) => current.textContent.trim()),
  ).toEqual(['5']);
});

test('disables Previous on the first page and Next on the last', () => {
  expect(button(mountPager(1, 3), 'previous').disabled).toBe(true);
  expect(button(mountPager(1, 3), 'next').disabled).toBe(false);
  expect(button(mountPager(3, 3), 'next').disabled).toBe(true);
  expect(button(mountPager(3, 3), 'previous').disabled).toBe(false);
});

test('emits page-change with the page clicked, out of the shadow root', () => {
  const pages = collect('page-change');
  const pager = mountPager(5, 12);
  button(pager, 'page-6').click();
  button(pager, 'next').click();
  expect(pages).toEqual([6, 6]);
});

test('emits nothing for a disabled button', () => {
  const pages = collect('page-change');
  button(mountPager(1, 3), 'previous').click();
  expect(pages).toEqual([]);
});

test('past the last page, says so and offers page 1', () => {
  const pages = collect('page-change');
  const pager = mountPager(4, 3);
  expect(pager.shadowRoot?.querySelector(testId('empty'))?.textContent).toBe('Nothing on this page.');
  expect(pager.shadowRoot?.querySelector(testId('pager'))).toBeNull();
  button(pager, 'first-page').click();
  expect(pages).toEqual([1]);
});

test('labels the arrows and pages for screen readers, in the current language', async () => {
  const { setLanguage } = await import('../i18n.ts');
  const pager = mountPager(2, 3);
  setLanguage('de');
  expect(buttons(pager).map((candidate) => candidate.getAttribute('aria-label'))).toEqual([
    'Vorherige Seite',
    'Seite 1',
    'Seite 2',
    'Seite 3',
    'Nächste Seite',
  ]);
});

test('re-renders when the page changes', () => {
  const pager = mountPager(1, 3);
  pager.setAttribute('page', '2');
  expect(
    buttons(pager)
      .find((candidate) => candidate.getAttribute('aria-current') === 'page')
      ?.textContent.trim(),
  ).toBe('2');
});
