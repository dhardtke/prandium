import { container } from "../../../deps.ts";
import { Oak } from "../../../deps_oak.ts";
import { RecipeController } from "../../controllers/recipe.controller.ts";
import { Recipe } from "../../data/model/recipe.ts";
import { toInt } from "../../data/util/convert.ts";
import { collectFormData, type FormData, urlWithParams } from "../util/mod.ts";
import { parameters } from "../util/parameters.ts";
import { UrlGenerator } from "../util/url_generator.ts";
import { AppState } from "../webserver.ts";

async function extractPostData(ctx: Oak.Context<AppState>) {
  const formDataReader: Oak.FormDataReader = await ctx.request.body({
    type: "form-data",
  }).value;
  const payload = await collectFormData<keyof Recipe>(
    formDataReader,
  );
  const thumbnail = payload.thumbnail?.[0] as Oak.FormDataFile;
  const payloadDeleteThumbnail = payload as unknown as FormData<"shouldDeleteThumbnail">;
  const shouldDeleteThumbnail = typeof payloadDeleteThumbnail.shouldDeleteThumbnail?.[0] !== "undefined";

  return {
    payload: payload as Record<keyof Recipe, string[]>,
    thumbnail,
    shouldDeleteThumbnail,
  };
}

export const RecipeRouter = new Oak.Router({ prefix: "/recipe" })
  .get("/import", (ctx: Oak.Context<AppState>) => {
    ctx.response.body = container.resolve(RecipeController).getImport();
  })
  .post(
    "/import",
    async (ctx: Oak.Context<AppState>, next: () => Promise<unknown>) => {
      if (!ctx.request.hasBody) {
        return await next();
      }

      const formData = await ctx.request.body({ type: "form" }).value;
      const rawUrls = formData.get("urls");
      const urls = rawUrls?.split("\n");

      ctx.response.body = await container.resolve(RecipeController).postImport(ctx.state.configDir, urls);
    },
  )
  .get("/:id/:slug/edit", (ctx: Oak.RouterContext<"/:id/:slug/edit", { id: string; slug: string }, AppState>) => {
    ctx.response.body = container.resolve(RecipeController).getEdit(toInt(ctx.params.id));
  })
  .post(
    "/:id/:slug/edit",
    async (
      ctx: Oak.RouterContext<"/:id/:slug/edit", { id: string; slug: string }, AppState>,
    ) => {
      const { payload, thumbnail, shouldDeleteThumbnail } = await extractPostData(ctx);
      const recipe = await container.resolve(RecipeController).postEdit(toInt(ctx.params.id), ctx.state.configDir, payload, thumbnail, shouldDeleteThumbnail);
      ctx.response.redirect(
        urlWithParams(UrlGenerator.recipe(recipe), {
          "flash": "editSuccessful",
        }, ctx.request.url),
      );
    },
  )
  .post("/:id/:slug/rate", async (ctx: Oak.RouterContext<"/:id/:slug/rate", { id: string; slug: string }, AppState>) => {
    const formData: URLSearchParams = await ctx.request.body({
      type: "form",
    }).value;
    const rating = parseFloat(formData.get("rating") ?? "0");
    ctx.response.body = container.resolve(RecipeController).rate(toInt(ctx.params.id), rating);
  })
  .get(
    "/create",
    (ctx: Oak.Context<AppState>) => {
      ctx.response.body = container.resolve(RecipeController).createGet();
    },
  )
  .post(
    "/create",
    async (ctx: Oak.Context<AppState>) => {
      const { payload, thumbnail, shouldDeleteThumbnail } = await extractPostData(ctx);
      const recipe = await container.resolve(RecipeController).postCreate(payload, ctx.state.configDir, thumbnail, shouldDeleteThumbnail);
      ctx.response.redirect(
        urlWithParams(UrlGenerator.recipe(recipe), {
          "flash": "createSuccessful",
        }, ctx.request.url),
      );
    },
  )
  .get(
    "/:id/:slug/delete",
    (
      ctx: Oak.RouterContext<"/:id/:slug/delete", { id: string; slug: string }, AppState>,
    ) => {
      ctx.response.body = container.resolve(RecipeController).getDelete(toInt(ctx.params.id));
    },
  )
  .post(
    "/:id/:slug/delete",
    async (
      ctx: Oak.RouterContext<"/:id/:slug/delete", { id: string; slug: string }, AppState>,
    ) => {
      await container.resolve(RecipeController).postDelete(toInt(ctx.params.id), ctx.state.configDir);
      ctx.response.redirect(
        urlWithParams(UrlGenerator.home(), {
          "flash": "deleteSuccessful",
        }, ctx.request.url),
      );
    },
  )
  .get("/:id/:slug/flag", (ctx: Oak.RouterContext<"/:id/:slug/flag", { id: string; slug: string }, AppState>) => {
    const recipe = container.resolve(RecipeController).flag(toInt(ctx.params.id));
    ctx.response.redirect(
      urlWithParams(UrlGenerator.recipe(recipe), {
        "flash": "editSuccessful",
      }, ctx.request.url),
    );
  })
  .get(
    "/:id/:slug",
    (
      ctx: Oak.RouterContext<"/:id/:slug", { id: string; slug: string }, AppState>,
    ) => {
      const portions = toInt(parameters(ctx).get("portions"));
      ctx.response.body = container.resolve(RecipeController).get(toInt(ctx.params.id), portions);
    },
  );
