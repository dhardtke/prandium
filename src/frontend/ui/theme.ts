import { THEME_STORAGE_KEY } from './storage-keys.ts';

export type Theme = 'light' | 'dark';

const EVENT = 'ce-theme-change';

export const THEMES: readonly Theme[] = ['light', 'dark'];

// `--card` from ui/app.css; also in index.html's no-flash script.
export const THEME_COLORS: Readonly<Record<Theme, string>> = { light: '#fff', dark: '#202024' };

function isTheme(value: string | null): value is Theme {
  return value === 'light' || value === 'dark';
}

function systemTheme(): Theme {
  try {
    return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

function readStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (isTheme(stored)) {
      return stored;
    }
  } catch {}
  return systemTheme();
}

let current = readStoredTheme();

export function currentTheme(): Theme {
  return current;
}

function applyTheme(): void {
  document.documentElement.setAttribute('data-theme', current);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLORS[current]);
}

export function setTheme(theme: Theme): void {
  if (theme === current) {
    return;
  }
  current = theme;

  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {}

  applyTheme();
  window.dispatchEvent(new CustomEvent(EVENT, { detail: { theme } }));
}

export function toggleTheme(): void {
  setTheme(current === 'dark' ? 'light' : 'dark');
}

export function onThemeChange(listener: () => void): () => void {
  window.addEventListener(EVENT, listener);
  return () => {
    window.removeEventListener(EVENT, listener);
  };
}

// index.html's script leaves the attribute off when unstored, so Oat paints the first frame.
applyTheme();
