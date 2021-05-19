import { assertEquals } from "../../../deps.ts";
import { parameters } from "../../../src/http/util/parameters.ts";

Deno.test(`get`, () => {
  assertEquals(parameters("https://www.example.org").get("q"), "");
  assertEquals(parameters("https://www.example.org").get("q", "oops"), "oops");
  assertEquals(parameters("https://www.example.org?q=42").get("q"), "42");
});

Deno.test(`getAll`, () => {
  assertEquals(parameters("https://www.example.org").getAll("q"), []);
  assertEquals(
    parameters("https://www.example.org").getAll("q", ["one", "two"]),
    ["one", "two"],
  );
  assertEquals(
    parameters("https://www.example.org?q=42&q=43&q=44").getAll("q"),
    ["42", "43", "44"],
  );
});

Deno.test(`set`, () => {
  assertEquals(
    parameters("https://www.example.org").set("q", "42").toString(),
    "https://www.example.org/?q=42",
  );
  assertEquals(
    parameters("https://www.example.org").set("q", "").toString(),
    "https://www.example.org/?q=",
  );
  assertEquals(
    parameters("https://www.example.org/?q=42").set("q", "43").toString(),
    "https://www.example.org/?q=43",
  );
});

Deno.test(`append`, () => {
  assertEquals(
    parameters("https://www.example.org").append("q", 42).toString(),
    "https://www.example.org/?q=42",
  );
  assertEquals(
    parameters("https://www.example.org").append("q", "").toString(),
    "https://www.example.org/?q=",
  );
  assertEquals(
    parameters("https://www.example.org/?q=42").append("q", "43").toString(),
    "https://www.example.org/?q=42&q=43",
  );
});

Deno.test(`remove`, () => {
  assertEquals(
    parameters("https://www.example.org").remove("q").toString(),
    "https://www.example.org/",
  );
  assertEquals(
    parameters("https://www.example.org/?q=42").remove("q").toString(),
    "https://www.example.org/",
  );
});

Deno.test(`removeSingleValue`, () => {
  assertEquals(
    parameters("https://www.example.org").removeSingleValue("q", "42")
      .toString(),
    "https://www.example.org/",
  );
  assertEquals(
    parameters("https://www.example.org/?q=42&bla=blub&q=43").removeSingleValue(
      "q",
      "43",
    ).toString(),
    "https://www.example.org/?bla=blub&q=42",
  );
});
