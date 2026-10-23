// noinspection HttpUrlsUsage

import { describe, expect, test } from "bun:test";
import type { Recipe as SchemaRecipe } from "schema-dts";
import { SchemaParser } from "../../../src/data/parse/schema-parser.ts";

describe("SchemaParser", () => {
    // test("Complex example", async () => {
    //     const contents = await Bun.file(root("tests/data/parse/complex.html")).text();
    //     const actual = new SchemaParser(contents).findFirstRecipe();
    //     // TODO
    //     expect(actual).not.toBeNull();
    // });

    test(`An Error is thrown if the HTML is not parseable`, () => {
        new SchemaParser("<'><!DOCTYPE xml>").findFirstRecipe();
    });

    test(`findFirstRecipe is empty if no Recipe can be found`, () => {
        const tests = [
            ``,
            `<!DOCTYPE html>
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
            `<!DOCTYPE html>
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
            expect(new SchemaParser(test).findFirstRecipe()).toEqual(null);
        }
    });

    test(`findFirstRecipe works with different HTML variations`, () => {
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
            expect(new SchemaParser(test).findFirstRecipe()).toEqual(expected);
        }
    });

    test(`findFirstRecipe extracts the Recipe from a @graph object`, () => {
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
            name: "My Recipe",
        };
        expect(new SchemaParser(html).findFirstRecipe()).toEqual(expected);
    });
});
