import { describe, expect, test } from 'bun:test';

type Theme = 'light' | 'dark';
type Palette = Map<string, Record<Theme, string>>;

const HEX = String.raw`#(?:[0-9a-f]{3}|[0-9a-f]{6})`;
const DECLARATION = new RegExp(String.raw`(--[\w-]+):\s*(${HEX}|light-dark\(\s*(${HEX})\s*,\s*(${HEX})\s*\))\s*;`, 'gi');

const sixDigits = (hex: string): string => (hex.length === 4 ? hex.replaceAll(/[0-9a-f]/g, '$&$&') : hex);

function readColors(css: string, into: Palette): void {
  for (const [, name, value, light, dark] of css.matchAll(DECLARATION)) {
    if (name === undefined || value === undefined) {
      continue;
    }
    into.set(name, {
      light: sixDigits((light ?? value).toLowerCase()),
      dark: sixDigits((dark ?? value).toLowerCase()),
    });
  }
}

const palette: Palette = new Map();
readColors(await Bun.file(`${import.meta.dir}/../../../node_modules/@knadh/oat/css/01-theme.css`).text(), palette);
readColors(await Bun.file(`${import.meta.dir}/app.css`).text(), palette);

function luminance(hex: string): number {
  const [r = 0, g = 0, b = 0] = [1, 3, 5].map((start) => {
    const channel = Number.parseInt(hex.slice(start, start + 2), 16) / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function ratio(theme: Theme, a: string, b: string): number {
  const color = (name: string): string => {
    const token = palette.get(name);
    if (token === undefined) {
      throw new Error(`${name} is not a color token`);
    }
    return token[theme];
  };
  const [lighter, darker] = [luminance(color(a)), luminance(color(b))].toSorted((x, y) => y - x);
  return ((lighter ?? 0) + 0.05) / ((darker ?? 0) + 0.05);
}

const TEXT = 4.5;
const CONTROL = 3;

/** [foreground, background, minimum ratio] */
const PAIRS: [string, string, number][] = [
  ...['--foreground', '--muted-foreground', '--primary', '--success', '--danger'].flatMap((text) =>
    ['--background', '--card'].map((surface): [string, string, number] => [text, surface, TEXT]),
  ),
  ['--primary-foreground', '--primary', TEXT],
  ['--danger-foreground', '--danger', TEXT],
  ['--success-foreground', '--success', TEXT],
  ['--muted-foreground', '--muted', TEXT],
  ...['--border', '--input'].flatMap((line) => ['--background', '--card'].map((surface): [string, string, number] => [line, surface, CONTROL])),
];

for (const theme of ['light', 'dark'] as const) {
  describe(`${theme} theme`, () => {
    test.each(PAIRS)(`%s on %s reaches %d:1`, (foreground, background, minimum) => {
      const actual = ratio(theme, foreground, background);
      expect(actual, `${theme}: ${foreground} on ${background} is ${actual.toFixed(2)}:1`).toBeGreaterThanOrEqual(minimum);
    });
  });
}
