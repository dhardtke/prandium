import { beforeAll, beforeEach, expect, test } from 'bun:test';
import { find, mount, shadow, testId, useDom } from '../testing.ts';
import type * as ThemeModule from '../ui/theme.ts';

useDom();

// The plain module, the instance the component uses, unlike theme.test.ts's `?N` copies.
let theme: typeof ThemeModule;

beforeAll(async () => {
  await import('./ce-theme-toggle.component.ts');
  theme = await import('../ui/theme.ts');
});

beforeEach(() => {
  theme.setTheme('light');
});

function mountToggle(): HTMLButtonElement {
  return find<HTMLButtonElement>(shadow(mount('ce-theme-toggle')), testId('toggle'));
}

function icons(button: HTMLButtonElement): { sun: boolean; moon: boolean } {
  return {
    sun: button.querySelector(testId('sun'))?.hasAttribute('hidden') === false,
    moon: button.querySelector(testId('moon'))?.hasAttribute('hidden') === false,
  };
}

test('shows the sun in light mode', () => {
  const button = mountToggle();
  expect(icons(button)).toEqual({ sun: true, moon: false });
  expect(button.getAttribute('aria-label')).toBe('Turn on dark mode');
});

test('turns on dark mode when clicked', () => {
  const button = mountToggle();
  button.click();
  expect(theme.currentTheme()).toBe('dark');
  expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  expect(icons(button)).toEqual({ sun: false, moon: true });
  expect(button.getAttribute('aria-label')).toBe('Turn off dark mode');
});

test('keeps its button, and the focus on it, across a click', () => {
  const button = mountToggle();
  button.focus();
  button.click();
  const root = button.getRootNode();
  expect(root instanceof ShadowRoot && root.querySelector(testId('toggle'))).toBe(button);
  expect(root instanceof ShadowRoot && root.activeElement).toBe(button);
});

test('follows a theme change made elsewhere', () => {
  const button = mountToggle();
  theme.setTheme('dark');
  expect(icons(button)).toEqual({ sun: false, moon: true });
  expect(button.getAttribute('aria-label')).toBe('Turn off dark mode');
});

test('stops following the theme once removed', () => {
  const button = mountToggle();
  document.body.replaceChildren();
  theme.setTheme('dark');
  expect(button.getAttribute('aria-label')).toBe('Turn on dark mode');
});
