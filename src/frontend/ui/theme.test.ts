import { beforeEach, describe, expect, test } from 'bun:test';
import { useGlobals } from '../testing.ts';
import { THEME_STORAGE_KEY } from './storage-keys.ts';
import type * as ThemeModule from './theme.ts';

const stub = useGlobals();

let stored: Map<string, string>;
let systemDark: boolean;
let storageBlocked: boolean;

beforeEach(() => {
  stored = new Map();
  systemDark = false;
  storageBlocked = false;

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
  stub('matchMedia', (query: string) => ({ matches: query === '(prefers-color-scheme: dark)' && systemDark }));
  themeColorMeta = new FakeElement();
  stub('document', {
    documentElement: new FakeElement(),
    querySelector: (selector: string) => (selector === 'meta[name="theme-color"]' ? themeColorMeta : null),
  });
  stub('window', new EventTarget());
});

class FakeElement {
  readonly attributes = new Map<string, string>();

  setAttribute(name: string, value: string): void {
    this.attributes.set(name, value);
  }
}

let themeColorMeta: FakeElement;

function htmlTheme(): string | undefined {
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- the stub installed in beforeEach
  return (document.documentElement as unknown as FakeElement).attributes.get('data-theme');
}

function themeColor(): string | undefined {
  return themeColorMeta.attributes.get('content');
}

let loads = 0;

// theme.ts reads the stored choice once, at load, so each test needs a fresh instance.
async function load(): Promise<typeof ThemeModule> {
  loads++;
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- the query string only defeats the module cache
  return (await import(`./theme.ts?${loads}`)) as typeof ThemeModule;
}

describe('at load', () => {
  test('a visitor who never chose follows the system: light', async () => {
    const theme = await load();

    expect(theme.currentTheme()).toBe('light');
    expect(htmlTheme()).toBe('light');
  });

  test('a visitor who never chose follows the system: dark', async () => {
    systemDark = true;

    expect((await load()).currentTheme()).toBe('dark');
    expect(htmlTheme()).toBe('dark');
  });

  test('a stored choice wins over the system', async () => {
    systemDark = true;
    stored.set(THEME_STORAGE_KEY, 'light');

    expect((await load()).currentTheme()).toBe('light');
  });

  test('the "system" an earlier version stored counts as no choice', async () => {
    systemDark = true;
    stored.set(THEME_STORAGE_KEY, 'system');

    expect((await load()).currentTheme()).toBe('dark');
  });

  test('blocked storage falls back to the system rather than throwing', async () => {
    systemDark = true;
    storageBlocked = true;

    expect((await load()).currentTheme()).toBe('dark');
  });

  test('a browser without matchMedia starts light', async () => {
    stub('matchMedia', undefined);

    expect((await load()).currentTheme()).toBe('light');
  });
});

describe('setTheme', () => {
  test('stores the choice, mirrors it onto <html> and tells listeners', async () => {
    const theme = await load();
    let heard = 0;
    theme.onThemeChange(() => {
      heard++;
    });

    theme.setTheme('dark');

    expect(theme.currentTheme()).toBe('dark');
    expect(stored.get(THEME_STORAGE_KEY)).toBe('dark');
    expect(htmlTheme()).toBe('dark');
    expect(heard).toBe(1);
  });

  test('the stored choice survives a reload, even once the system disagrees', async () => {
    (await load()).setTheme('dark');
    systemDark = false;

    expect((await load()).currentTheme()).toBe('dark');
  });

  test('choosing the current theme again does nothing, so the system stays in charge', async () => {
    const theme = await load();
    let heard = 0;
    theme.onThemeChange(() => {
      heard++;
    });

    theme.setTheme('light');

    expect(stored.has(THEME_STORAGE_KEY)).toBe(false);
    expect(heard).toBe(0);
  });

  test('still applies for the page when storage is blocked', async () => {
    const theme = await load();
    storageBlocked = true;

    theme.setTheme('dark');

    expect(theme.currentTheme()).toBe('dark');
    expect(htmlTheme()).toBe('dark');
  });

  test('onThemeChange returns a function that stops listening', async () => {
    const theme = await load();
    let heard = 0;
    const stop = theme.onThemeChange(() => {
      heard++;
    });

    stop();
    theme.setTheme('dark');

    expect(heard).toBe(0);
  });
});

describe('toggleTheme', () => {
  test('from light stores and applies dark, and tells listeners once', async () => {
    const theme = await load();
    let heard = 0;
    theme.onThemeChange(() => {
      heard++;
    });

    theme.toggleTheme();

    expect(theme.currentTheme()).toBe('dark');
    expect(stored.get(THEME_STORAGE_KEY)).toBe('dark');
    expect(htmlTheme()).toBe('dark');
    expect(heard).toBe(1);
  });

  test('toggling twice returns to light and stores it', async () => {
    const theme = await load();

    theme.toggleTheme();
    theme.toggleTheme();

    expect(theme.currentTheme()).toBe('light');
    expect(stored.get(THEME_STORAGE_KEY)).toBe('light');
    expect(htmlTheme()).toBe('light');
  });
});

describe('theme-color', () => {
  test('at load it matches the theme: light, dark from the system, and dark stored', async () => {
    const theme = await load();
    expect(themeColor()).toBe(theme.THEME_COLORS.light);

    systemDark = true;
    await load();
    expect(themeColor()).toBe(theme.THEME_COLORS.dark);

    systemDark = false;
    stored.set(THEME_STORAGE_KEY, 'dark');
    await load();
    expect(themeColor()).toBe(theme.THEME_COLORS.dark);
  });

  test('setTheme and toggleTheme update it', async () => {
    const theme = await load();

    theme.setTheme('dark');
    expect(themeColor()).toBe(theme.THEME_COLORS.dark);

    theme.toggleTheme();
    expect(themeColor()).toBe(theme.THEME_COLORS.light);
  });

  test('a document without the meta tag does not throw', async () => {
    stub('document', { documentElement: new FakeElement(), querySelector: () => null });

    const theme = await load();

    expect(() => {
      theme.toggleTheme();
    }).not.toThrow();
  });

  test('matches --card in app.css and the inline script in index.html', async () => {
    const { THEME_COLORS } = await load();
    const css = await Bun.file(`${import.meta.dir}/app.css`).text();
    const card = /--card:\s*light-dark\(\s*([^,\s]+)\s*,\s*([^)\s]+)\s*\)/.exec(css);
    expect([card?.[1], card?.[2]]).toEqual([THEME_COLORS.light, THEME_COLORS.dark]);

    // The script body only: the meta tag's own content="#fff" would always match.
    const html = await Bun.file(`${import.meta.dir}/../index.html`).text();
    const script = /<script>([\s\S]*?)<\/script>/.exec(html)?.[1] ?? '';
    expect(script).toContain(`'${THEME_COLORS.light}'`);
    expect(script).toContain(`'${THEME_COLORS.dark}'`);
  });
});
