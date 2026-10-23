import { describe, expect, test } from "bun:test";
import { parameters } from "../../../src/http/util/parameters.ts";

describe("parameters", () => {
    test(`get`, () => {
        expect(parameters("https://www.example.org").get("q")).toEqual("");
        expect(parameters("https://www.example.org").get("q", "oops")).toEqual("oops");
        expect(parameters("https://www.example.org?q=42").get("q")).toEqual("42");
    });

    test(`getAll`, () => {
        expect(parameters("https://www.example.org").getAll("q")).toEqual([]);
        expect(parameters("https://www.example.org").getAll("q", ["one", "two"])).toEqual(["one", "two"]);
        expect(parameters("https://www.example.org?q=42&q=43&q=44").getAll("q")).toEqual(["42", "43", "44"]);
    });

    test(`set`, () => {
        expect(parameters("https://www.example.org").set("q", "42").toString()).toEqual("https://www.example.org/?q=42");
        expect(parameters("https://www.example.org").set("q", "").toString()).toEqual("https://www.example.org/?q=");
        expect(parameters("https://www.example.org/?q=42").set("q", "43").toString()).toEqual("https://www.example.org/?q=43");
    });

    test(`append`, () => {
        expect(parameters("https://www.example.org").append("q", 42).toString()).toEqual("https://www.example.org/?q=42");
        expect(parameters("https://www.example.org").append("q", "").toString()).toEqual("https://www.example.org/?q=");
        expect(parameters("https://www.example.org/?q=42").append("q", "43").toString()).toEqual("https://www.example.org/?q=42&q=43");
    });

    test(`remove`, () => {
        expect(parameters("https://www.example.org").remove("q").toString()).toEqual("https://www.example.org/");
        expect(parameters("https://www.example.org/?q=42").remove("q").toString()).toEqual("https://www.example.org/");
    });

    test(`removeSingleValue`, () => {
        expect(parameters("https://www.example.org").removeSingleValue("q", "42").toString()).toEqual("https://www.example.org/");
        expect(parameters("https://www.example.org/?q=42&bla=blub&q=43").removeSingleValue("q", "43").toString()).toEqual(
            "https://www.example.org/?bla=blub&q=42",
        );
    });
});
