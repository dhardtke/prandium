import * as needle from "@needle-di/core";
import { RecipeController } from "../../controllers/recipe.controller.ts";
import { translateFormDataToRecipe, translateFormDataToThumbnail } from "../../data/model/recipe.ts";
import { toInt } from "../../data/util/convert.ts";
import { NotFoundError } from "../../shared/errors.ts";
import { html, redirect, text } from "../server/responses.ts";
import { AppRequest } from "../server/types.ts";
import { urlWithParams } from "../util/mod.ts";
import { parameters } from "../util/parameters.ts";
import { UrlGenerator } from "../util/url-generator.ts";
import { Router } from "./router.ts";

@needle.injectable()
export class RecipeRouter extends Router {
    constructor(private recipeController: RecipeController = needle.inject(RecipeController)) {
        super("/recipe");

        this.get("/import", this.getImport)
            .post("/import", this.postImport)
            .get("/:id/:slug/edit", this.getEdit)
            .post("/:id/:slug/edit", this.postEdit)
            .post("/:id/:slug/rate", this.rate)
            .get("/create", this.getCreate)
            .post("/create", this.postCreate)
            .get("/:id/:slug/delete", this.getDelete)
            .post("/:id/:slug/delete", this.postDelete)
            .get("/:id/:slug/flag", this.flag)
            .get("/:id/:slug", this.getRecipe);
    }

    getImport = (): Response => {
        return html(this.recipeController.getImport());
    };

    postImport = async (req: AppRequest): Promise<Response> => {
        if (req.request.body === null) {
            throw new NotFoundError("No URLs to import given.");
        }

        const formData = await req.request.formData();
        const urls = formData.get("urls")?.toString().split("\n");

        const body = await this.recipeController.postImport(urls);
        if (body === undefined) {
            throw new NotFoundError("No URLs to import given.");
        }
        return html(body);
    };

    getEdit = (req: AppRequest): Response => {
        return html(this.recipeController.getEdit(toInt(req.params.id)));
    };

    postEdit = async (req: AppRequest): Promise<Response> => {
        const formData = await req.request.formData();
        const { thumbnail, shouldDeleteThumbnail } = translateFormDataToThumbnail(formData);
        const inputRecipe = translateFormDataToRecipe(formData);
        const recipe = await this.recipeController.postEdit(toInt(req.params.id), inputRecipe, thumbnail, shouldDeleteThumbnail);
        return redirect(urlWithParams(UrlGenerator.recipe(recipe), { flash: "editSuccessful" }, req.url));
    };

    rate = async (req: AppRequest): Promise<Response> => {
        const formData = await req.request.formData();
        const rating = parseFloat(formData.get("rating")?.toString() ?? "0");
        return text(this.recipeController.rate(toInt(req.params.id), rating));
    };

    getCreate = (): Response => {
        return html(this.recipeController.createGet());
    };

    postCreate = async (req: AppRequest): Promise<Response> => {
        const formData = await req.request.formData();
        const { thumbnail, shouldDeleteThumbnail } = translateFormDataToThumbnail(formData);
        const inputRecipe = translateFormDataToRecipe(formData);
        const recipe = await this.recipeController.postCreate(inputRecipe, thumbnail, shouldDeleteThumbnail);
        return redirect(urlWithParams(UrlGenerator.recipe(recipe), { flash: "createSuccessful" }, req.url));
    };

    getDelete = (req: AppRequest): Response => {
        return html(this.recipeController.getDelete(toInt(req.params.id)));
    };

    postDelete = async (req: AppRequest): Promise<Response> => {
        await this.recipeController.postDelete(toInt(req.params.id));
        return redirect(urlWithParams(UrlGenerator.home(), { flash: "deleteSuccessful" }, req.url));
    };

    flag = (req: AppRequest): Response => {
        const recipe = this.recipeController.flag(toInt(req.params.id));
        return redirect(urlWithParams(UrlGenerator.recipe(recipe), { flash: "editSuccessful" }, req.url));
    };

    getRecipe = (req: AppRequest): Response => {
        const portions = toInt(parameters(req.url).get("portions"), 0);
        return html(this.recipeController.get(toInt(req.params.id), portions === 0 ? undefined : portions));
    };
}
