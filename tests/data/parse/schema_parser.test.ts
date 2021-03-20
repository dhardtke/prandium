import { SchemaParser } from "../../../src/data/parse/schema_parser.ts";
import { assertEquals } from "../../deps.ts";

Deno.test("hello world #1", () => {
  const x = 1 + 2;
  assertEquals(x, 3);
});
//
// Deno.test("Complex example", () => {
//     Deno.chdir(path.dirname(path.fromFileUrl(import.meta.url)));
//     const contents = Deno.readTextFileSync("complex.html");
//     const actual = findFirstRecipe(contents);
//     // TODO
//     assertNotEquals(actual, null);
// });

Deno.test("An Error should be thrown if the HTML is not parseable", () => {
  new SchemaParser("<'><!DOCTYPE xml>").findFirstRecipe();
});
