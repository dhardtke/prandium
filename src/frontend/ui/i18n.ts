import { de } from '../i18n/de.ts';
import { en } from '../i18n/en.ts';
import type { Language, LanguageId } from '../i18n/language.ts';

// Also in index.html's pre-paint script.
const STORAGE_KEY = 'prandium:language';
export const LANGUAGE_CHANGE_EVENT = 'pr-language-change';

export const LANGUAGES: Readonly<Record<LanguageId, Language>> = { en, de };
export const LANGUAGE_IDS: readonly LanguageId[] = ['en', 'de'];

function isLanguageId(value: string | null | undefined): value is LanguageId {
  return value === 'en' || value === 'de';
}

function browserLanguage(): LanguageId {
  // Bun's own navigator, before a test installs a DOM, has neither field.
  // oxlint-disable-next-line typescript/no-unnecessary-condition -- see above
  const preferred: unknown[] = typeof navigator === 'undefined' ? [] : [...(navigator.languages ?? []), navigator.language];
  for (const tag of preferred) {
    const id = typeof tag === 'string' ? tag.toLowerCase().split('-')[0] : undefined;
    if (isLanguageId(id)) {
      return id;
    }
  }
  return 'en';
}

function readStoredLanguage(): LanguageId {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (isLanguageId(stored)) {
      return stored;
    }
  } catch {}
  return browserLanguage();
}

let current = readStoredLanguage();

export function language(): Language {
  return LANGUAGES[current];
}

export const t = language;

export function setLanguage(id: LanguageId): void {
  if (id === current) {
    return;
  }
  current = id;
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {}
  applyLanguage();
  window.dispatchEvent(new CustomEvent(LANGUAGE_CHANGE_EVENT, { detail: { language: id } }));
}

export function onLanguageChange(listener: () => void): () => void {
  window.addEventListener(LANGUAGE_CHANGE_EVENT, listener);
  return () => {
    window.removeEventListener(LANGUAGE_CHANGE_EVENT, listener);
  };
}

function applyLanguage(): void {
  // Absent only in tests that import a formatter without a DOM.
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('lang', current);
  }
}

applyLanguage();
