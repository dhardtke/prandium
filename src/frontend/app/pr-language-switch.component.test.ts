import { beforeAll, expect, test } from 'bun:test';
import { find, mount, shadow, testId, useDom } from '../testing.ts';
import type * as I18n from '../ui/i18n.ts';

useDom();

let i18n: typeof I18n;

beforeAll(async () => {
  await import('./pr-language-switch.component.ts');
  i18n = await import('../ui/i18n.ts');
});

test('names the current language and offers each language in its own', () => {
  const root = shadow(mount('pr-language-switch'));
  expect(find(root, testId('toggle')).textContent.trim()).toBe('English');
  expect(find(root, testId('language-de')).textContent.trim()).toBe('Deutsch');
  expect(find(root, testId('language-de')).getAttribute('lang')).toBe('de');
  expect(find(root, testId('language-en')).getAttribute('aria-checked')).toBe('true');
});

test('switches the language when one is chosen, and re-renders in it', () => {
  const root = shadow(mount('pr-language-switch'));
  find<HTMLButtonElement>(root, testId('language-de')).click();
  expect(i18n.language().meta.id).toBe('de');
  expect(document.documentElement.getAttribute('lang')).toBe('de');
  expect(find(root, testId('toggle')).textContent.trim()).toBe('Deutsch');
  expect(find(root, testId('toggle')).getAttribute('aria-label')).toBe('Sprache: Deutsch');
  expect(find(root, testId('language-de')).getAttribute('aria-checked')).toBe('true');
});
