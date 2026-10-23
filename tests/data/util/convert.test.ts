import { describe, expect, test } from "bun:test";
import { toCamelCase, toDate, toFloat, toInt } from "../../../src/data/util/convert.ts";

describe("convert", () => {
    describe("toInt", () => {
        for (const str of ["", undefined, "undefined", "foo", "bar", "   ", "+"]) {
            test(`Given str="${str}" and default=-1 Then it returns the fallback value -1`, () => {
                expect(toInt(str, -1)).toEqual(-1);
            });
        }

        for (const [str, expected] of [
            ["42", 42],
            ["0", 0],
            // oxlint-disable-next-line no-loss-of-precision
            ["102341998323241321", 102341998323241321],
        ] as [string, number][]) {
            test(`Given str="${str}" and default=-1 Then it returns the parsed value ${expected}`, () => {
                expect(toInt(str as string, -1)).toEqual(expected);
            });
        }
    });

    describe("toFloat", () => {
        for (const str of ["", undefined, "undefined", "foo", "bar", "   ", "+"]) {
            test(`Given str="${str}" and default=-1 Then it returns the fallback value -1`, () => {
                expect(toFloat(str, -1)).toEqual(-1);
            });
        }

        for (const [str, expected] of [
            ["42", 42],
            ["0", 0],
            // oxlint-disable-next-line no-loss-of-precision
            ["102341998323241321", 102341998323241321],
            // oxlint-disable-next-line no-loss-of-precision
            ["432934294823942.20012", 432934294823942.20012],
        ] as [string, number][]) {
            test(`Given str="${str}" and default=-1 Then it returns the parsed value ${expected}`, () => {
                expect(toFloat(str as string, -1)).toEqual(expected);
            });
        }
    });

    describe("toDate", () => {
        for (const str of ["", undefined, "abc"]) {
            const fallback = new Date(0);
            test(`Given str="${str}" and _default=${fallback} Then it returns the fallback value`, () => {
                expect(toDate(str, fallback)).toEqual(fallback);
            });
        }

        for (const [str, expected] of [
            ["0", new Date(0)],
            ["1616804763", new Date(1616804763)],
            ["2016-09-12T00:00:00.000Z", new Date("2016-09-12T00:00:00.000Z")],
        ] as [string, Date][]) {
            test(`Given str="${str}" and _default=undefined Then it returns the parsed value ${expected}`, () => {
                expect(toDate(str as string, undefined)).toEqual(expected);
            });
        }
    });

    test("toCamelCase", () => {
        expect(toCamelCase({})).toEqual({});
        expect(toCamelCase({ hello_world: true })).toEqual({ helloWorld: true });
        expect(toCamelCase({ bla: null })).toEqual({ bla: null });
        expect(toCamelCase(["a", "b"])).toEqual(["a", "b"]);
        expect(toCamelCase({ arr: ["a", "b", { my_arr: ["d"] }] })).toEqual({
            arr: ["a", "b", { myArr: ["d"] }],
        });
        expect(
            toCamelCase({
                id: 42,
                created_at: "yesterday",
                updated_at: null,
                nested_obj: {
                    created_at: "today",
                    deep_object: {
                        deep: true,
                        arr: [42, 43],
                    },
                },
            }),
        ).toEqual({
            id: 42,
            createdAt: "yesterday",
            updatedAt: null,
            nestedObj: {
                createdAt: "today",
                deepObject: {
                    deep: true,
                    arr: [42, 43],
                },
            },
        });
    });
});
