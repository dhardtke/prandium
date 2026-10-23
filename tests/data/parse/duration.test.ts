import { describe, expect, test } from "bun:test";
import { Duration, durationToMinutes, parseDuration } from "../../../src/data/parse/duration.ts";

describe("duration", () => {
    test(`Parse duration datetime successful`, () => {
        const tests = new Map<string, Duration>([
            [
                "P0003-06-04T12:30:05",
                {
                    years: 3,
                    months: 6,
                    weeks: 0,
                    days: 4,
                    hours: 12,
                    minutes: 30,
                    seconds: 5,
                },
            ],
            [
                "PT0S",
                {
                    years: 0,
                    months: 0,
                    weeks: 0,
                    days: 0,
                    hours: 0,
                    minutes: 0,
                    seconds: 0,
                },
            ],
            [
                "P0D",
                {
                    years: 0,
                    months: 0,
                    weeks: 0,
                    days: 0,
                    hours: 0,
                    minutes: 0,
                    seconds: 0,
                },
            ],
            [
                "PT36H",
                {
                    years: 0,
                    months: 0,
                    weeks: 0,
                    days: 0,
                    hours: 36,
                    minutes: 0,
                    seconds: 0,
                },
            ],
            [
                "P1DT12H",
                {
                    years: 0,
                    months: 0,
                    weeks: 0,
                    days: 1,
                    hours: 12,
                    minutes: 0,
                    seconds: 0,
                },
            ],
            [
                "P0.5Y",
                {
                    years: 0.5,
                    months: 0,
                    weeks: 0,
                    days: 0,
                    hours: 0,
                    minutes: 0,
                    seconds: 0,
                },
            ],
            [
                "PT0.5S",
                {
                    years: 0,
                    months: 0,
                    weeks: 0,
                    days: 0,
                    hours: 0,
                    minutes: 0,
                    seconds: 0.5,
                },
            ],
            [
                "PT0,5S",
                {
                    years: 0,
                    months: 0,
                    weeks: 0,
                    days: 0,
                    hours: 0,
                    minutes: 0,
                    seconds: 0.5,
                },
            ],
        ]);
        for (const [input, expected] of tests.entries()) {
            const actual = parseDuration(input);
            expect(actual).toEqual(expected);
        }
    });

    test(`Parse duration unsuccessful`, () => {
        const tests = new Map<string, string>([
            ["", "Duration must start with 'P'"],
            ["P10", "Unexpected end of input"],
            ["P10T10", "Unexpected T: Expected designator"],
            ["PTT", "Unexpected character T at position 2"],
            ["P10DT10A", "Unexpected character A at position 7"],
            ["PP", "Unexpected character P at position 1"],
            ["PT", "Unexpected end of input"],
            ["P0.5YT0.25M0.25S", "Only the smallest provided designator is allowed to be a float"],
            ["P0.5YT0.25S", "Only the smallest provided designator is allowed to be a float"],
            ["PT0.5M0.25S", "Only the smallest provided designator is allowed to be a float"],
        ]);
        for (const [input, expected] of tests.entries()) {
            expect(() => parseDuration(input)).toThrow(expected);
        }
    });

    test(`durationToMinutes`, () => {
        expect(
            durationToMinutes({
                years: 0,
                months: 0,
                weeks: 0,
                days: 0,
                hours: 0,
                minutes: 0,
                seconds: 0,
            }),
        ).toEqual(0);
        expect(
            durationToMinutes({
                years: 0,
                months: 0,
                weeks: 0,
                days: 0,
                hours: 0,
                minutes: 0,
                seconds: 1,
            }),
        ).toEqual(0);
        expect(
            durationToMinutes({
                years: 0,
                months: 0,
                weeks: 0,
                days: 0,
                hours: 0,
                minutes: 1,
                seconds: 0,
            }),
        ).toEqual(1);
        expect(
            durationToMinutes({
                years: 0,
                months: 0,
                weeks: 0,
                days: 0,
                hours: 1,
                minutes: 0,
                seconds: 0,
            }),
        ).toEqual(60);
        expect(
            durationToMinutes({
                years: 0,
                months: 0,
                weeks: 0,
                days: 1,
                hours: 0,
                minutes: 0,
                seconds: 0,
            }),
        ).toEqual(24 * 60);
        expect(
            durationToMinutes({
                years: 0,
                months: 0,
                weeks: 1,
                days: 0,
                hours: 0,
                minutes: 0,
                seconds: 0,
            }),
        ).toEqual(7 * 24 * 60);
        expect(
            durationToMinutes({
                years: 0,
                months: 1,
                weeks: 0,
                days: 0,
                hours: 0,
                minutes: 0,
                seconds: 0,
            }),
        ).toEqual(31 * 24 * 60);
        expect(
            durationToMinutes({
                years: 1,
                months: 0,
                weeks: 0,
                days: 0,
                hours: 0,
                minutes: 0,
                seconds: 0,
            }),
        ).toEqual(365 * 24 * 60);
        expect(
            durationToMinutes({
                years: 3,
                months: 2,
                weeks: 4,
                days: 5,
                hours: 10,
                minutes: 47,
                seconds: 36,
            }),
        ).toEqual(((365 * 3 + 2 * 31 + 4 * 7 + 5) * 24 + 10) * 60 + 47 + 1);
    });
});
