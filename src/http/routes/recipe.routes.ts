import { fs, Oak, path } from "../../../deps.ts";
import { Recipe } from "../../data/model/recipe.ts";
import { importRecipes } from "../../data/parse/import/import_recipe.ts";
import { RecipeService } from "../../data/service/recipe.service.ts";
import { toNumber } from "../../data/util/convert.ts";
import {
  getThumbnailDir,
  getUniqueFilename,
} from "../../data/util/thumbnails.ts";
import {
  RecipeDeleteTemplate,
  RecipeDetailTemplate,
  RecipeEditTemplate,
  RecipeImportTemplate,
  RecipeListTemplate,
} from "../../tpl/mod.ts";
import { UrlHelper } from "../url_helper.ts";
import { collectFormData, urlWithParams } from "../util.ts";
import { AppState } from "../webserver.ts";

async function deleteThumbnail(recipe: Recipe, configDir: string) {
  // delete old thumbnail
  if (recipe.thumbnail) {
    const thumbnailDir = getThumbnailDir(configDir);
    try {
      await Deno.remove(path.join(thumbnailDir, recipe.thumbnail));
    } catch {
      // ignore
    }
  }
}

async function assignRecipeFields(
  formDataReader: Oak.FormDataReader,
  recipe: Recipe,
  configDir: string,
) {
  type RecipeKey = keyof Recipe;
  const data = await collectFormData<RecipeKey | "deleteThumbnail">(
    formDataReader,
  );
  const get = (name: RecipeKey) => {
    return (data[name] as string[])[0];
  };
  const stringFields: RecipeKey[] = [
    "title",
    "description",
    "source",
    "nutritionCalories",
    "nutritionCarbohydrate",
    "nutritionCholesterol",
    "nutritionFat",
    "nutritionFiber",
    "nutritionProtein",
    "nutritionSaturatedFat",
    "nutritionSodium",
    "nutritionSugar",
    "nutritionTransFat",
    "nutritionUnsaturatedFat",
  ];
  for (const field of stringFields) {
    recipe[field] = get(field) as never;
  }
  recipe.source = get("source");
  recipe.yield = toNumber(get("yield"), undefined);
  recipe.prepTime = toNumber(get("prepTime"));
  recipe.cookTime = toNumber(get("cookTime"));
  recipe.aggregateRatingValue = toNumber(get("aggregateRatingValue"));
  recipe.aggregateRatingCount = toNumber(get("aggregateRatingCount"));
  recipe.rating = toNumber(get("rating"));
  recipe.ingredients = data.ingredients as string[];
  recipe.instructions = data.instructions as string[];
  if (data.deleteThumbnail) {
    await deleteThumbnail(recipe, configDir);
    recipe.thumbnail = undefined;
  }
  if (data.thumbnail) {
    const [newThumbnail] = data.thumbnail as [Oak.FormDataFile];
    if (newThumbnail.filename) {
      // TODO server-side type validation?
      const thumbnailDir = getThumbnailDir(configDir);
      const filename = getUniqueFilename(
        thumbnailDir,
        newThumbnail.originalName,
      );
      await fs.move(newThumbnail.filename, path.join(thumbnailDir, filename));
      await deleteThumbnail(recipe, configDir);
      recipe.thumbnail = filename;
    }
  }
  recipe.updatedAt = new Date();
}

const router: Oak.Router = new Oak.Router({ prefix: "/recipe" });
router
  .get("/", async (ctx: Oak.Context<AppState>) => {
    const service: RecipeService = ctx.state.services.RecipeService;

    const tagIds = ctx.request.url.searchParams.getAll("tagId").map((id) =>
      toNumber(id, -1)
    ).filter((i) => i !== -1);
    const title = ctx.parameter("title");
    const recipes = ctx.paginate(
      service.count({ tagIds, title }),
      (limit, offset) =>
        service.list(
          {
            limit,
            offset,
            orderBy: ctx.orderBy({ column: "title" }),
            filters: {
              tagIds,
              title,
            },
          },
        ),
    );
    const tags = tagIds.length
      ? ctx.state.services.TagService.list({
        filters: { ids: tagIds },
      })
      : [];
    await ctx.render(RecipeListTemplate, {
      recipes,
      tags,
    });
  })
  .get("/import", async (ctx: Oak.Context<AppState>) => {
    await ctx.render(RecipeImportTemplate, undefined);
  })
  .post(
    "/import",
    async (ctx: Oak.Context<AppState>, next: () => Promise<void>) => {
      if (!ctx.request.hasBody) {
        return await next();
      }
      const formData = await ctx.request.body({ type: "form" }).value;
      const urls = formData.get("urls");
      if (!urls) {
        return await next();
      }
      const results = await importRecipes({
        urls: urls!.split("\n"),
        configDir: ctx.state.configDir,
        importWorkerCount: ctx.state.settings.importWorkerCount,
      });
      const service = ctx.state.services.RecipeService;
      service.create(results.filter((r) => r.success).map((r) => r.recipe!));
      await ctx.render(RecipeImportTemplate, { results });
    },
  )
  .get(
    "/:id/:slug/edit",
    async (ctx: Oak.Context<AppState>, next: () => Promise<void>) => {
      const service = ctx.state.services.RecipeService;
      const recipe = service.find(
        toNumber(ctx.parameter("id")),
        true,
        true,
        true,
      );
      if (!recipe) {
        await next();
      } else {
        await ctx.render(RecipeEditTemplate, {
          recipe,
        });
      }
    },
  )
  .post(
    "/:id/:slug/edit",
    async (ctx: Oak.Context<AppState>, next: () => Promise<void>) => {
      const service = ctx.state.services.RecipeService;
      const recipe = service.find(
        toNumber(ctx.parameter("id")),
        true,
        true,
        true,
      );
      if (!recipe) {
        await next();
      } else {
        const formDataReader: Oak.FormDataReader = await ctx.request.body({
          type: "form-data",
        }).value;
        await assignRecipeFields(formDataReader, recipe, ctx.state.configDir);
        service.update([recipe]);
        ctx.response.redirect(
          urlWithParams(UrlHelper.INSTANCE.recipe(recipe), {
            "flash": "editSuccessful",
          }, ctx.request.url),
        );
      }
    },
  )
  .get(
    "/create",
    async (ctx: Oak.Context<AppState>) => {
      await ctx.render(RecipeEditTemplate, undefined);
    },
  )
  .post(
    "/create",
    async (ctx: Oak.Context<AppState>) => {
      const service = ctx.state.services.RecipeService;
      const recipe = new Recipe({});
      const formDataReader: Oak.FormDataReader = await ctx.request.body({
        type: "form-data",
      }).value;
      await assignRecipeFields(formDataReader, recipe, ctx.state.configDir);
      service.create([recipe]);
      ctx.response.redirect(
        urlWithParams(UrlHelper.INSTANCE.recipe(recipe), {
          "flash": "createSuccessful",
        }, ctx.request.url),
      );
    },
  )
  .get(
    "/:id/:slug/delete",
    async (ctx: Oak.Context<AppState>, next: () => Promise<void>) => {
      const service = ctx.state.services.RecipeService;
      const recipe = service.find(
        toNumber(ctx.parameter("id")),
      );
      if (!recipe) {
        await next();
      } else {
        await ctx.render(RecipeDeleteTemplate, {
          recipe,
        });
      }
    },
  )
  .post(
    "/:id/:slug/delete",
    async (ctx: Oak.Context<AppState>, next: () => Promise<void>) => {
      const service = ctx.state.services.RecipeService;
      const recipe = service.find(
        toNumber(ctx.parameter("id")),
      );
      if (!recipe) {
        await next();
      } else {
        await deleteThumbnail(recipe, ctx.state.configDir);
        service.delete([recipe]);
        ctx.response.redirect(
          urlWithParams(UrlHelper.INSTANCE.recipeList(), {
            "flash": "deleteSuccessful",
          }, ctx.request.url),
        );
      }
    },
  )
  .get(
    "/:id/:slug",
    async (ctx: Oak.Context<AppState>, next: () => Promise<void>) => {
      const service = ctx.state.services.RecipeService;
      const recipe = service.find(
        toNumber(ctx.parameter("id")),
        true,
        true,
        true,
      );
      if (!recipe) {
        await next();
      } else {
        await ctx.render(RecipeDetailTemplate, {
          recipe,
          portions: toNumber(ctx.parameter("portions"), recipe.yield),
        });
      }
    },
  );

export { router as RecipeRouter };
