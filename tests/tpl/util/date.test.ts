import { assertEquals } from "../../../deps.ts";
import { de } from "../../../src/i18n/de.ts";
import { en } from "../../../src/i18n/en.ts";
import { Language, setLanguage } from "../../../src/i18n/mod.ts";
import { date, number } from "../../../src/tpl/util/format.ts";

Deno.test(`number.format should accept undefined`, () => {
  assertEquals(number.format(undefined), "");
});

interface Test<Options = unknown, Value = number> {
  language: Language;
  value: Value;
  options?: Options;
  expected: string;
}

Deno.test(`date.format`, () => {
  const tests: Test<Intl.DateTimeFormatOptions>[] = [
    { language: en, value: 0, options: undefined, expected: "1/1/1970" },
    {
      language: en,
      value: 0,
      options: { day: "2-digit", month: "long", year: "2-digit" },
      expected: "January 01, 70",
    },
    {
      language: en,
      value: 1577883600000,
      options: { day: "2-digit", month: "long", year: "2-digit" },
      expected: "January 01, 20",
    },
    { language: de, value: 0, options: undefined, expected: "1.1.1970" },
    {
      language: de,
      value: 0,
      options: { day: "2-digit", month: "long", year: "2-digit" },
      expected: "01. Januar 70",
    },
    {
      language: de,
      value: 1577883600000,
      options: { day: "2-digit", month: "long", year: "2-digit" },
      expected: "01. Januar 20",
    },
  ];
  for (const test of tests) {
    setLanguage(test.language);
    assertEquals(
      date.format(new Date(test.value), test.options),
      test.expected,
    );
  }
});

Deno.test(`date.formatRelative should accept undefined`, () => {
  assertEquals(date.formatRelative(undefined), "");
});

Deno.test(`date.formatRelative`, () => {
  const tests: Test<unknown, [number, number?]>[] = [
    { language: en, value: [0, 0], expected: "now" },
    { language: en, value: [0, 1000], expected: "1 second ago" },
    { language: en, value: [1000, 0], expected: "in 1 second" },
    { language: en, value: [0, 1000 * 60], expected: "1 minute ago" },
    { language: en, value: [1000 * 60, 0], expected: "in 1 minute" },
    { language: en, value: [0, 1000 * 60 * 60], expected: "1 hour ago" },
    { language: en, value: [1000 * 60 * 60, 0], expected: "in 1 hour" },
    { language: en, value: [0, 1000 * 60 * 60 * 24], expected: "yesterday" },
    { language: en, value: [1000 * 60 * 60 * 24, 0], expected: "tomorrow" },
    {
      language: en,
      value: [0, 1000 * 60 * 60 * 24 * 365],
      expected: "last year",
    },
    {
      language: en,
      value: [1000 * 60 * 60 * 24 * 365, 0],
      expected: "next year",
    },

    { language: de, value: [0, 0], expected: "jetzt" },
    { language: de, value: [0, 1000], expected: "vor 1 Sekunde" },
    { language: de, value: [1000, 0], expected: "in 1 Sekunde" },
    { language: de, value: [0, 1000 * 60], expected: "vor 1 Minute" },
    { language: de, value: [1000 * 60, 0], expected: "in 1 Minute" },
    { language: de, value: [0, 1000 * 60 * 60], expected: "vor 1 Stunde" },
    { language: de, value: [1000 * 60 * 60, 0], expected: "in 1 Stunde" },
    { language: de, value: [0, 1000 * 60 * 60 * 24], expected: "gestern" },
    { language: de, value: [1000 * 60 * 60 * 24, 0], expected: "morgen" },
    {
      language: de,
      value: [0, 1000 * 60 * 60 * 24 * 365],
      expected: "letztes Jahr",
    },
    {
      language: de,
      value: [1000 * 60 * 60 * 24 * 365, 0],
      expected: "nächstes Jahr",
    },
  ];
  for (const test of tests) {
    setLanguage(test.language);
    assertEquals(
      date.formatRelative(
        new Date(test.value[0]),
        test.value[1] === undefined ? undefined : new Date(test.value[1]),
      ),
      test.expected,
    );
  }

  setLanguage(en);
  assertEquals(date.formatRelative(new Date()), "now");
});

Deno.test(`date.relativeTimeFromElapsed should accept undefined`, () => {
  assertEquals(date.relativeTimeFromElapsed(undefined), "");
});

Deno.test(`date.relativeTimeFromElapsed`, () => {
  const tests: Test[] = [
    { language: en, value: 0, expected: "now" },
    { language: en, value: 1000, expected: "in 1 second" },
    { language: en, value: 1000 * 60, expected: "in 1 minute" },
    { language: en, value: 1000 * 60 * 60, expected: "in 1 hour" },
    { language: en, value: 1000 * 60 * 60 * 24, expected: "tomorrow" },
    { language: en, value: 1000 * 60 * 60 * 24 * 365, expected: "next year" },

    { language: de, value: 0, expected: "jetzt" },
    { language: de, value: 1000, expected: "in 1 Sekunde" },
    { language: de, value: 1000 * 60, expected: "in 1 Minute" },
    { language: de, value: 1000 * 60 * 60, expected: "in 1 Stunde" },
    { language: de, value: 1000 * 60 * 60 * 24, expected: "morgen" },
    {
      language: de,
      value: 1000 * 60 * 60 * 24 * 365,
      expected: "nächstes Jahr",
    },
  ];
  for (const test of tests) {
    setLanguage(test.language);
    assertEquals(date.relativeTimeFromElapsed(test.value), test.expected);
  }
});

Deno.test(`date.formatSeconds should accept undefined`, () => {
  assertEquals(date.formatMinutes(undefined), "");
});

Deno.test(`date.formatMinutes`, () => {
  const tests: Test[] = [
    { language: en, value: 0, expected: "0 seconds" },
    { language: en, value: 1, expected: "1 minute" },
    { language: en, value: 60, expected: "1 hour" },
    { language: en, value: 60 * 24, expected: "1 day" },
    { language: en, value: 60 * 24 * 365, expected: "1 year" },

    { language: de, value: 0, expected: "0 Sekunden" },
    { language: de, value: 1, expected: "1 Minute" },
    { language: de, value: 60, expected: "1 Stunde" },
    { language: de, value: 60 * 24, expected: "1 Tag" },
    { language: de, value: 60 * 24 * 365, expected: "1 Jahr" },
  ];
  for (const test of tests) {
    setLanguage(test.language);
    assertEquals(date.formatMinutes(test.value), test.expected);
  }
});

Deno.test(`number.format`, () => {
  const tests: Test<number>[] = [
    { language: en, value: 42, options: undefined, expected: "42.00" },
    { language: en, value: 42, options: 2, expected: "42.00" },
    { language: en, value: 42, options: 1, expected: "42.0" },
    { language: en, value: 42, options: 0, expected: "42" },
    { language: en, value: 42.123, options: 0, expected: "42" },
    { language: en, value: 42.123, options: 1, expected: "42.1" },
    { language: en, value: 42.123, options: 2, expected: "42.12" },
    { language: en, value: 42.123, options: 3, expected: "42.123" },

    { language: de, value: 42, options: undefined, expected: "42,00" },
  ];
  for (const test of tests) {
    setLanguage(test.language);
    assertEquals(number.format(test.value, test.options), test.expected);
  }
});
