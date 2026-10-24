import { beforeEach, describe, expect, test } from 'bun:test';
import { useGlobals } from '../testing.ts';
import { LANGUAGE_STORAGE_KEY } from './storage-keys.ts';
import type * as I18nModule from './i18n.ts';

const stub = useGlobals();

let stored: Map<string, string>;
let storageBlocked: boolean;
let htmlLang: string | undefined;

beforeEach(() => {
  stored = new Map();
  storageBlocked = false;
  htmlLang = undefined;

  const guard = (): void => {
    if (storageBlocked) {
      throw new DOMException('The operation is insecure.', 'SecurityError');
    }
  };
  stub('localStorage', {
    getItem: (key: string) => {
      guard();
      return stored.get(key) ?? null;
    },
    setItem: (key: string, value: string) => {
      guard();
      stored.set(key, value);
    },
  });
  browser('en-US');
  stub('document', {
    documentElement: {
      setAttribute: (name: string, value: string) => {
        if (name === 'lang') {
          htmlLang = value;
        }
      },
    },
  });
  stub('window', new EventTarget());
});

function browser(...languages: string[]): void {
  stub('navigator', { language: languages[0] ?? '', languages });
}

let loads = 0;

// i18n.ts reads the stored choice once, at load, so each test needs a fresh instance.
async function load(): Promise<typeof I18nModule> {
  loads++;
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- the query string only defeats the module cache
  return (await import(`./i18n.ts?${loads}`)) as typeof I18nModule;
}

describe('at load', () => {
  test('a visitor who never chose gets the browser language', async () => {
    browser('de-DE', 'en');

    const i18n = await load();

    expect(i18n.language().meta.id).toBe('de');
    expect(i18n.t().recipes).toBe('Rezepte');
    expect(htmlLang).toBe('de');
  });

  test('a later browser language counts when the first is not offered', async () => {
    browser('fr-FR', 'de');

    expect((await load()).language().meta.id).toBe('de');
  });

  test('falls back to English when no browser language is offered', async () => {
    browser('fr-FR', 'it');

    expect((await load()).language().meta.id).toBe('en');
    expect(htmlLang).toBe('en');
  });

  test('a stored choice wins over the browser', async () => {
    browser('de-DE');
    stored.set(LANGUAGE_STORAGE_KEY, 'en');

    expect((await load()).language().meta.id).toBe('en');
  });

  test('an unknown stored value counts as no choice', async () => {
    browser('de');
    stored.set(LANGUAGE_STORAGE_KEY, 'fr');

    expect((await load()).language().meta.id).toBe('de');
  });

  test('blocked storage falls back to the browser rather than throwing', async () => {
    browser('de');
    storageBlocked = true;

    expect((await load()).language().meta.id).toBe('de');
  });
});

describe('setLanguage', () => {
  test('stores the choice, mirrors it onto <html lang> and tells listeners', async () => {
    const i18n = await load();
    let heard = 0;
    i18n.onLanguageChange(() => {
      heard++;
    });

    i18n.setLanguage('de');

    expect(i18n.t().recipes).toBe('Rezepte');
    expect(stored.get(LANGUAGE_STORAGE_KEY)).toBe('de');
    expect(htmlLang).toBe('de');
    expect(heard).toBe(1);
  });

  test('the stored choice survives a reload', async () => {
    (await load()).setLanguage('de');

    expect((await load()).language().meta.id).toBe('de');
  });

  test('choosing the current language again does nothing', async () => {
    const i18n = await load();
    let heard = 0;
    i18n.onLanguageChange(() => {
      heard++;
    });

    i18n.setLanguage('en');

    expect(stored.has(LANGUAGE_STORAGE_KEY)).toBe(false);
    expect(heard).toBe(0);
  });

  test('onLanguageChange returns a function that stops listening', async () => {
    const i18n = await load();
    let heard = 0;
    const stop = i18n.onLanguageChange(() => {
      heard++;
    });

    stop();
    i18n.setLanguage('de');

    expect(heard).toBe(0);
  });
});

describe('the dictionaries', () => {
  test('have the same keys in every language', async () => {
    const { LANGUAGES } = await load();
    const keys = (value: unknown, prefix = ''): string[] =>
      typeof value === 'object' && value !== null ? Object.entries(value).flatMap(([key, child]) => keys(child, `${prefix}${key}.`)) : [prefix.slice(0, -1)];

    expect(keys(LANGUAGES.de).sort()).toEqual(keys(LANGUAGES.en).sort());
  });
});
