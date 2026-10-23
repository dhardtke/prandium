import { describe, expect, test } from "bun:test";
import { RecipeController } from "../../../src/controllers/recipe.controller.ts";
import { Recipe } from "../../../src/data/model/recipe.ts";
import { RecipeRouter } from "../../../src/http/routers/recipe.router.ts";
import { toAppRequest } from "../../../src/http/server/request.ts";

describe("toAppRequest", () => {
    test("uses the URL of the request without forwarding headers", () => {
        expect(toAppRequest(new Request("http://localhost:8000/recipe?id=1")).url.toString()).toEqual("http://localhost:8000/recipe?id=1");
    });

    test("honours X-Forwarded-Proto and X-Forwarded-Host", () => {
        const request = new Request("http://127.0.0.1:8000/recipe?id=1", {
            headers: { "X-Forwarded-Proto": "https", "X-Forwarded-Host": "recipes.example.org" },
        });

        expect(toAppRequest(request).url.toString()).toEqual("https://recipes.example.org/recipe?id=1");
    });

    test("uses the first value of multiple forwarded values", () => {
        const request = new Request("http://127.0.0.1:8000/", {
            headers: { "X-Forwarded-Proto": "https, http", "X-Forwarded-Host": "a.example.org, b.example.org" },
        });

        expect(toAppRequest(request).url.toString()).toEqual("https://a.example.org/");
    });

    test("ignores invalid X-Forwarded-Proto values", () => {
        const request = new Request("http://127.0.0.1:8000/", { headers: { "X-Forwarded-Proto": "javascript" } });

        expect(toAppRequest(request).url.protocol).toEqual("http:");
    });

    test("redirects behind a proxy keep the https: URL", async () => {
        const recipe = new Recipe({ id: 42, title: "My Recipe" });
        const controller = { flag: () => recipe } as unknown as RecipeController;
        const handler = new RecipeRouter(controller).routes()["/recipe/:id/:slug/flag"].GET!;
        const request = new Request("http://127.0.0.1:8000/recipe/42/my-recipe/flag", {
            headers: { "X-Forwarded-Proto": "https", "X-Forwarded-Host": "recipes.example.org" },
        });

        const response = await handler(toAppRequest(request, { id: "42", slug: "my-recipe" }));

        expect(response.status).toEqual(302);
        expect(response.headers.get("Location")).toEqual("https://recipes.example.org/recipe/42/my-recipe?flash=editSuccessful");
    });
});
