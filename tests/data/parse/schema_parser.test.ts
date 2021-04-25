import { SchemaParser } from "../../../src/data/parse/schema_parser.ts";

const TestPrefix = "[data/parse/schema_parser]";
//
// Deno.test("Complex example", () => {
//     Deno.chdir(path.dirname(path.fromFileUrl(import.meta.url)));
//     const contents = Deno.readTextFileSync("complex.html");
//     const actual = findFirstRecipe(contents);
//     // TODO
//     assertNotEquals(actual, null);
// });

Deno.test(`${TestPrefix} An Error should be thrown if the HTML is not parseable`, () => {
  new SchemaParser("<'><!DOCTYPE xml>").findFirstRecipe();
});
