import { Oak } from "../../../deps-oak.ts";
import { singleton } from "../../../deps.ts";
import { RecipeController } from "../../controllers/recipe.controller.ts";
import { Recipe } from "../../data/model/recipe.ts";
import { toInt } from "../../data/util/convert.ts";
import { collectFormData, urlWithParams } from "../util/mod.ts";
import { parameters } from "../util/parameters.ts";
import { UrlGenerator } from "../util/url_generator.ts";
import { AppState } from "../webserver.ts";
import { Router } from "./router.ts";

async function extractPostData(ctx: Oak.Context<AppState>) {
  const formDataReader: Oak.FormDataReader = await ctx.request.body({
    type: "form-data",
  }).value;
  const payload = await collectFormData<keyof Recipe | "shouldDeleteThumbnail">(
    formDataReader,
  );
  const thumbnail = payload.thumbnail?.[0] as Oak.FormDataFile;
  const shouldDeleteThumbnail = typeof payload.shouldDeleteThumbnail?.[0] !== "undefined";

  return {
    payload: payload as Record<keyof Recipe, string[]>,
    thumbnail,
    shouldDeleteThumbnail,
  };
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

  getImport = (ctx: Oak.Context<AppState>) => {
    ctx.response.body = this.recipeController.getImport();
  };

  postImport = async (ctx: Oak.Context<AppState>, next: () => Promise<unknown>) => {
    if (!ctx.request.hasBody) {
      return await next();
    }

    const formData = await ctx.request.body({ type: "form" }).value;
    const rawUrls = formData.get("urls");
    const urls = rawUrls?.split("\n");

    ctx.response.body = await this.recipeController.postImport(urls);
  };

  getEdit = (ctx: Oak.RouterContext<"/:id/:slug/edit", { id: string; slug: string }, AppState>) => {
    ctx.response.body = this.recipeController.getEdit(toInt(ctx.params.id));
  };

  postEdit = async (
    ctx: Oak.RouterContext<"/:id/:slug/edit", { id: string; slug: string }, AppState>,
  ) => {
    const { payload, thumbnail, shouldDeleteThumbnail } = await extractPostData(ctx);
    const recipe = await this.recipeController.postEdit(toInt(ctx.params.id), payload, thumbnail, shouldDeleteThumbnail);
    ctx.response.redirect(
      urlWithParams(UrlGenerator.recipe(recipe), {
        "flash": "editSuccessful",
      }, ctx.request.url),
    );
  };

  rate = async (ctx: Oak.RouterContext<"/:id/:slug/rate", { id: string; slug: string }, AppState>) => {
    const formData: URLSearchParams = await ctx.request.body({
      type: "form",
    }).value;
    const rating = parseFloat(formData.get("rating") ?? "0");
    ctx.response.body = this.recipeController.rate(toInt(ctx.params.id), rating);
  };

  getCreate = (ctx: Oak.Context<AppState>) => {
    ctx.response.body = this.recipeController.createGet();
  };

  postCreate = async (ctx: Oak.Context<AppState>) => {
    const { payload, thumbnail, shouldDeleteThumbnail } = await extractPostData(ctx);
    const recipe = await this.recipeController.postCreate(payload, thumbnail, shouldDeleteThumbnail);
    ctx.response.redirect(
      urlWithParams(UrlGenerator.recipe(recipe), {
        "flash": "createSuccessful",
      }, ctx.request.url),
    );
  };

  getDelete = (
    ctx: Oak.RouterContext<"/:id/:slug/delete", { id: string; slug: string }, AppState>,
  ) => {
    ctx.response.body = this.recipeController.getDelete(toInt(ctx.params.id));
  };

  postDelete = async (
    ctx: Oak.RouterContext<"/:id/:slug/delete", { id: string; slug: string }, AppState>,
  ) => {
    await this.recipeController.postDelete(toInt(ctx.params.id));
    ctx.response.redirect(
      urlWithParams(UrlGenerator.home(), {
        "flash": "deleteSuccessful",
      }, ctx.request.url),
    );
  };

  flag = (ctx: Oak.RouterContext<"/:id/:slug/flag", { id: string; slug: string }, AppState>) => {
    const recipe = this.recipeController.flag(toInt(ctx.params.id));
    ctx.response.redirect(
      urlWithParams(UrlGenerator.recipe(recipe), {
        "flash": "editSuccessful",
      }, ctx.request.url),
    );
  };

  get = (
    ctx: Oak.RouterContext<"/:id/:slug", { id: string; slug: string }, AppState>,
  ) => {
    const portions = toInt(parameters(ctx).get("portions"), 0);
    ctx.response.body = this.recipeController.get(toInt(ctx.params.id), portions === 0 ? undefined : portions);
  };
}
