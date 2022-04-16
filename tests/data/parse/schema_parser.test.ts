// noinspection HttpUrlsUsage

import { type SchemaRecipe } from "../../../deps.ts";
import { assertEquals } from "../../../deps-test.ts";
import { SchemaParser } from "../../../src/data/parse/schema-parser.ts";
import { html } from "../../../src/tpl/mod.ts";

Deno.test("SchemaParser", async (t) => {
  // await t.step("Complex example", () => {
  //     Deno.chdir(path.dirname(path.fromFileUrl(import.meta.url)));
  //     const contents = Deno.readTextFileSync("complex.html");
  //     const actual = findFirstRecipe(contents);
  //     // TODO
  //     assertNotEquals(actual, null);
  // });

  await t.step(`An Error is thrown if the HTML is not parseable`, () => {
    new SchemaParser("<'><!DOCTYPE xml>").findFirstRecipe();
  });

  await t.step(`findFirstRecipe is empty if no Recipe can be found`, () => {
    const tests = [
      ``,
      html`<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf8">
        <title>Hello World</title>
      </head>
      <body>
      Hello
      <p>World</p>
      </body>
      </html>`,
      html`<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf8">
        <title>Hello World</title>
      </head>
      <body>
      Hello
      <p>World</p>
      <script type="application/ld+json">
      {"@context": "http://schema.org","@type": "WebSite","name": "Prandium","url": "https://example.com","publisher": {"@type": "Organization","name": "Prandium"}}
    </script>
    </body>
    </html>`,
    ];
    for (const test of tests) {
      assertEquals(new SchemaParser(test).findFirstRecipe(), null);
    }
  });

  await t.step(`findFirstRecipe works with different HTML variations`, () => {
    const json = `{"@context": "http://schema.org", "@type": "Recipe", "recipeCategory": "K\u00e4se", "name": "My awesome recipe"}`;
    const tests = [
      `<script type=application/ld+json>${json}</script>`,
      `<script type="application/ld+json">${json}</script>`,
      `<script type='application/ld+json'>${json}</script>`,
      `<script async type=application/ld+json>${json}</script>`,
      `<script type=application/ld+json defer>${json}</script>`,
    ];
    const expected: SchemaRecipe = {
      "@type": "Recipe",
      recipeCategory: "K\u00e4se",
      name: "My awesome recipe",
    };
    for (const test of tests) {
      assertEquals(new SchemaParser(test).findFirstRecipe(), expected);
    }
  });

  await t.step(`findFirstRecipe extracts the Recipe from a @graph object`, () => {
    const html = `<script type="application/ld+json" class="yoast-schema-graph">
    {
        "@context": "https://schema.org",
        "@graph": [
            { "@type": "Organization", "name": "My Org", "url": "https://example.org/" },
            { "@type": "WebSite" },
            { "@type": "ImageObject" },
            { "@type": "WebPage" },
            { "@type": "BreadcrumbList" },
            { "@context": "http://schema.org/", "@type": "Recipe", "name": "My Recipe" },
            { "@type": "Article" }
        ]
    }
    </script>`;
    const expected: SchemaRecipe = {
      "@type": "Recipe",
      "name": "My Recipe",
    };
    assertEquals(new SchemaParser(html).findFirstRecipe(), expected);
  });
});
