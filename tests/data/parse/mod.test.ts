import {assertEquals, assertNotEquals, path} from "../../deps.ts";
import {parse} from "../../../src/data/parse/mod.ts";

Deno.test("hello world #1", () => {
    const x = 1 + 2;
    assertEquals(x, 3);
});

Deno.test("Complex example", () => {
    Deno.chdir(path.dirname(path.fromFileUrl(import.meta.url)));
    const contents = Deno.readTextFileSync("idiotensichere_lasagne.html");
    const actual = parse(contents);
    // TODO
    assertNotEquals(actual, null);
});

Deno.test("An Error should be thrown if the HTML is not parseable", () => {
    parse("<'><!DOCTYPE xml>");
});
