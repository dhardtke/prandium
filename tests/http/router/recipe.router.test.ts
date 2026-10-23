import { describe, expect, mock, test } from "bun:test";
import { RecipeController } from "../../../src/controllers/recipe.controller.ts";
import { RecipeRouter } from "../../../src/http/routers/recipe.router.ts";
import { toAppRequest } from "../../../src/http/server/request.ts";

describe("RecipeRouter", () => {
    test("routes are registered with the /recipe prefix", () => {
        const routes = new RecipeRouter({} as RecipeController).routes();

        expect(Object.fromEntries(Object.entries(routes).map(([path, handlers]) => [path, Object.keys(handlers)]))).toEqual({
            "/recipe/import": ["GET", "POST"],
            "/recipe/:id/:slug/edit": ["GET", "POST"],
            "/recipe/:id/:slug/rate": ["POST"],
            "/recipe/create": ["GET", "POST"],
            "/recipe/:id/:slug/delete": ["GET", "POST"],
            "/recipe/:id/:slug/flag": ["GET"],
            "/recipe/:id/:slug": ["GET"],
        });
    });

    test("rate passes the rating to the controller and responds with text/plain", async () => {
        const rate = mock(() => "Ok");
        const handler = new RecipeRouter({ rate } as unknown as RecipeController).routes()["/recipe/:id/:slug/rate"].POST!;
        const request = new Request("http://localhost/recipe/42/my-recipe/rate", { method: "POST", body: new URLSearchParams({ rating: "4.5" }) });

        const response = await handler(toAppRequest(request, { id: "42", slug: "my-recipe" }));

        expect(rate).toHaveBeenCalledWith(42, 4.5);
        expect(response.headers.get("Content-Type")).toEqual("text/plain; charset=utf-8");
        expect(await response.text()).toEqual("Ok");
    });
});
