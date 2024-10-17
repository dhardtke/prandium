import { Oak, singleton } from "../../../deps.ts";
import { RecipeController } from "../../controllers/recipe.controller.ts";
import { translateFormDataToRecipe, translateFormDataToThumbnail } from "../../data/model/recipe.ts";
import { toInt } from "../../data/util/convert.ts";
import { urlWithParams } from "../util/mod.ts";
import { parameters } from "../util/parameters.ts";
import { UrlGenerator } from "../util/url-generator.ts";
import { AppState } from "../webserver.ts";
import { Router } from "./router.ts";

function baseUrl(ctx: Oak.Context): URL {
    const base = new URL(ctx.request.url);
    base.port = (ctx.request.headers.get("host") ?? "").split(":")[1] ?? "";
    return base;
}

@singleton()
export class RecipeRouter extends Router {
    constructor(private recipeController: RecipeController) {
        super({ prefix: "/recipe" });

        this.router
            .get("/import", this.getImport)
            .post("/import", this.postImport)
            .get("/:id/:slug/edit", this.getEdit)
            .post("/:id/:slug/edit", this.postEdit)
            .post("/:id/:slug/rate", this.rate)
            .get("/create", this.getCreate)
            .post("/create", this.postCreate)
            .get("/:id/:slug/delete", this.getDelete)
            .post("/:id/:slug/delete", this.postDelete)
            .get("/:id/:slug/flag", this.flag)
            .get("/:id/:slug", this.get);
    }

    getImport: Oak.RouterMiddleware<"/import"> = (ctx) => {
        ctx.response.body = this.recipeController.getImport();
    };

    postImport: Oak.RouterMiddleware<"/import"> = async (ctx, next) => {
        if (!ctx.request.hasBody) {
            return await next();
        }

        const formData = await ctx.request.body.form();
        const rawUrls = formData.get("urls");
        const urls = rawUrls?.split("\n");

        ctx.response.body = await this.recipeController.postImport(urls);
    };

    getEdit: Oak.RouterMiddleware<"/:id/:slug/edit", { id: string; slug: string }> = (ctx) => {
        ctx.response.body = this.recipeController.getEdit(toInt(ctx.params.id));
    };

    postEdit: Oak.RouterMiddleware<"/:id/:slug/edit", { id: string; slug: string }, AppState> = async (ctx) => {
        const formData = await ctx.request.body.formData();
        const { thumbnail, shouldDeleteThumbnail } = await translateFormDataToThumbnail(formData);
        const foo = translateFormDataToRecipe(formData);
        const recipe = await this.recipeController.postEdit(toInt(ctx.params.id), foo, thumbnail, shouldDeleteThumbnail);
        ctx.response.redirect(
            urlWithParams(UrlGenerator.recipe(recipe), {
                "flash": "editSuccessful",
            }, baseUrl(ctx)),
        );
    };

    rate: Oak.RouterMiddleware<"/:id/:slug/rate", { id: string; slug: string }> = async (ctx) => {
        const formData = await ctx.request.body.form();
        const rating = parseFloat(formData.get("rating") ?? "0");
        ctx.response.body = this.recipeController.rate(toInt(ctx.params.id), rating);
    };

    getCreate: Oak.RouterMiddleware<"/create"> = (ctx) => {
        ctx.response.body = this.recipeController.createGet();
    };

    postCreate: Oak.RouterMiddleware<"/create", Record<never, never>, AppState> = async (ctx) => {
        const formData = await ctx.request.body.formData();
        const { thumbnail, shouldDeleteThumbnail } = await translateFormDataToThumbnail(formData);
        const foo = translateFormDataToRecipe(formData);
        const recipe = await this.recipeController.postCreate(foo, thumbnail, shouldDeleteThumbnail);
        ctx.response.redirect(
            urlWithParams(UrlGenerator.recipe(recipe), {
                "flash": "createSuccessful",
            }, baseUrl(ctx)),
        );
    };

    getDelete: Oak.RouterMiddleware<"/:id/:slug/delete", { id: string; slug: string }> = (ctx) => {
        ctx.response.body = this.recipeController.getDelete(toInt(ctx.params.id));
    };

    postDelete: Oak.RouterMiddleware<"/:id/:slug/delete", { id: string; slug: string }> = async (ctx) => {
        await this.recipeController.postDelete(toInt(ctx.params.id));
        ctx.response.redirect(
            urlWithParams(UrlGenerator.home(), {
                "flash": "deleteSuccessful",
            }, baseUrl(ctx)),
        );
    };

    flag: Oak.RouterMiddleware<"/:id/:slug/flag", { id: string; slug: string }> = (ctx) => {
        const recipe = this.recipeController.flag(toInt(ctx.params.id));
        ctx.response.redirect(
            urlWithParams(UrlGenerator.recipe(recipe), {
                "flash": "editSuccessful",
            }, baseUrl(ctx)),
        );
    };

    get: Oak.RouterMiddleware<"/:id/:slug", { id: string; slug: string }> = (ctx) => {
        const portions = toInt(parameters(ctx).get("portions"), 0);
        ctx.response.body = this.recipeController.get(toInt(ctx.params.id), portions === 0 ? undefined : portions);
    };
}
