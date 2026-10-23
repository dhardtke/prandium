import { afterAll, describe, expect, test } from "bun:test";
import { de } from "../../../src/i18n/de.ts";
import { en } from "../../../src/i18n/en.ts";
import { Language, setLanguage } from "../../../src/i18n/mod.ts";
import { date, number } from "../../../src/tpl/util/format.ts";

interface Test<Options = unknown, Value = number> {
    language: Language;
    value: Value;
    options?: Options;
    expected: string;
}

describe("format", () => {
    afterAll(() => {
        setLanguage(en);
    });

    describe("number.format", () => {
        test("When given undefined Then it returns an empty string", () => {
            expect(number.format(undefined)).toEqual("");
        });
    });

    describe("date.format", () => {
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
        for (const testCase of tests) {
            test(`When given ${testCase.value} with options=${JSON.stringify(
                testCase.options,
            )} and the language ${testCase.language.meta.id} Then it returns ${testCase.expected}`, () => {
                setLanguage(testCase.language);
                expect(date.format(new Date(testCase.value), testCase.options)).toEqual(testCase.expected);
            });
        }
    });

    describe("date.formatRelative", () => {
        test("When given undefined Then it returns an empty string", () => {
            expect(date.formatRelative(undefined)).toEqual("");
        });

        describe("date.formatRelative", () => {
            const tests: Test<unknown, [number, number?]>[] = [
                { language: en, value: [new Date().getTime()], expected: "now" },
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
            for (const testCase of tests) {
                test(`When given relative=${testCase.value[0]}, pivot=${testCase.value[1]} with the language ${testCase.language.meta.id} Then it returns ${testCase.expected}`, () => {
                    setLanguage(testCase.language);
                    expect(date.formatRelative(new Date(testCase.value[0]), testCase.value[1] === undefined ? undefined : new Date(testCase.value[1]))).toEqual(
                        testCase.expected,
                    );
                });
            }
        });
    });

    describe("date.relativeTimeFromElapsed", () => {
        test("When given undefined Then it returns an empty string", () => {
            expect(date.relativeTimeFromElapsed(undefined)).toEqual("");
        });

        test("date.relativeTimeFromElapsed", () => {
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
            for (const testCase of tests) {
                setLanguage(testCase.language);
                expect(date.relativeTimeFromElapsed(testCase.value)).toEqual(testCase.expected);
            }
        });
    });

    describe("date.formatMinutes", () => {
        test("When given undefined Then it returns an empty string", () => {
            expect(date.formatMinutes(undefined)).toEqual("");
        });

        describe("date.formatMinutes", () => {
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
            for (const testCase of tests) {
                test(`When given ${testCase.value} with the language ${testCase.language.meta.id} Then it returns ${testCase.expected}`, () => {
                    setLanguage(testCase.language);
                    expect(date.formatMinutes(testCase.value)).toEqual(testCase.expected);
                });
            }
        });
    });

    describe("number.format", () => {
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
        for (const testCase of tests) {
            test(`When given num=${testCase.value}, decimals=${JSON.stringify(
                testCase.options,
            )} with the language ${testCase.language.meta.id} Then it returns ${testCase.expected}`, () => {
                setLanguage(testCase.language);
                expect(number.format(testCase.value, testCase.options)).toEqual(testCase.expected);
            });
        }
    });
});
