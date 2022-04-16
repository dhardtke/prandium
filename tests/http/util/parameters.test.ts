import { assertEquals } from "../../../deps-test.ts";
import { parameters } from "../../../src/http/util/parameters.ts";

Deno.test("parameters", async (t) => {
  await t.step(`get`, () => {
    assertEquals(parameters("https://www.example.org").get("q"), "");
    assertEquals(parameters("https://www.example.org").get("q", "oops"), "oops");
    assertEquals(parameters("https://www.example.org?q=42").get("q"), "42");
  });

  await t.step(`getAll`, () => {
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

  await t.step(`set`, () => {
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

  await t.step(`append`, () => {
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

  await t.step(`remove`, () => {
    assertEquals(
      parameters("https://www.example.org").remove("q").toString(),
      "https://www.example.org/",
    );
    assertEquals(
      parameters("https://www.example.org/?q=42").remove("q").toString(),
      "https://www.example.org/",
    );
  });

  await t.step(`removeSingleValue`, () => {
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
});
