import { fs, Oak, path } from "../../../deps.ts";
import { Recipe } from "../../data/model/recipe.ts";
import { importRecipes } from "../../data/parse/import/import_recipe.ts";
import { RecipeService } from "../../data/service/recipe.service.ts";
import { services } from "../../data/service/services.ts";
import { TagService } from "../../data/service/tag.service.ts";
import { toNumber } from "../../data/util/convert.ts";
import {
  getThumbnailDir,
  getUniqueFilename,
} from "../../data/util/thumbnails.ts";
import { RecipeDeleteTemplate } from "../../tpl/templates/recipe/recipe_delete.template.ts";
import { RecipeDetailTemplate } from "../../tpl/templates/recipe/recipe_detail.template.ts";
import { RecipeEditTemplate } from "../../tpl/templates/recipe/recipe_edit.template.ts";
import { RecipeImportTemplate } from "../../tpl/templates/recipe/recipe_import.template.ts";
import { RecipeListTemplate } from "../../tpl/templates/recipe/recipe_list.template.ts";
import { collectFormData, urlWithParams } from "../util/mod.ts";
import { UrlGenerator } from "../util/url_generator.ts";
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
  if (data.history?.length % 2 === 0) {
    recipe.history = [];
    for (let i = 0; i < data.history.length; i += 2) {
      const [year, month, day] = String(data.history[i]).split("-").map(
        toNumber,
      );
      const [hour, minute, second] = String(data.history[i + 1]).split(":").map(
        toNumber,
      );
      const date = new Date(year, month - 1, day); // JS months start at 0
      date.setHours(hour, minute, second);
      recipe.history.push(date);
    }
  }

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
  .get("/", (ctx: Oak.Context<AppState>) => {
    const service: RecipeService = services.get(RecipeService);

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

    const tags = services.get(TagService).list({
      orderBy: { column: "title" },
      loadRecipeCount: true,
      filters: {
        tagsWithSameRecipes: {
          ids: tagIds,
          includeOthers: true,
        },
      },
    });
    ctx.response.body = RecipeListTemplate(
      recipes,
      tags,
      ctx.state.settings.infiniteScrolling,
    );
  })
  .get("/import", (ctx: Oak.Context<AppState>) => {
    ctx.response.body = RecipeImportTemplate();
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
        userAgent: ctx.state.settings.userAgent,
      });
      const service = services.get(RecipeService);
      service.create(results.filter((r) => r.success).map((r) => r.recipe!));
      ctx.response.body = RecipeImportTemplate(results);
    },
  )
  .get(
    "/:id/:slug/edit",
    async (ctx: Oak.Context<AppState>, next: () => Promise<void>) => {
      const service = services.get(RecipeService);
      const recipe = service.find(
        toNumber(ctx.parameter("id")),
        true,
        true,
        true,
      );
      if (!recipe) {
        await next();
      } else {
        ctx.response.body = RecipeEditTemplate(recipe);
      }
    },
  )
  .post(
    "/:id/:slug/edit",
    async (ctx: Oak.Context<AppState>, next: () => Promise<void>) => {
      const service = services.get(RecipeService);
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
        service.update([recipe], true);
        ctx.response.redirect(
          urlWithParams(UrlGenerator.recipe(recipe), {
            "flash": "editSuccessful",
          }, ctx.request.url),
        );
      }
    },
  )
  .post(
    "/:id/:slug/rate",
    async (ctx: Oak.Context<AppState>, next: () => Promise<void>) => {
      // TODO use update route and ensure only non-empty fields are set?
      const service = services.get(RecipeService);
      const recipe = service.find(
        toNumber(ctx.parameter("id")),
        false,
        true,
      );
      if (!recipe) {
        await next();
      } else {
        const formData: URLSearchParams = await ctx.request.body({
          type: "form",
        }).value;
        if (ctx.state.settings.addHistoryEntryWhenRating) {
          if (!recipe.rating) {
            recipe.history.push(new Date());
          }
        }
        recipe.rating = parseFloat(formData.get("rating") ?? "0");
        service.update([recipe], true);
        ctx.response.body = "Ok";
      }
    },
  )
  .get(
    "/create",
    (ctx: Oak.Context<AppState>) => {
      ctx.response.body = RecipeEditTemplate();
    },
  )
  .post(
    "/create",
    async (ctx: Oak.Context<AppState>) => {
      const service = services.get(RecipeService);
      const recipe = new Recipe({});
      const formDataReader: Oak.FormDataReader = await ctx.request.body({
        type: "form-data",
      }).value;
      await assignRecipeFields(formDataReader, recipe, ctx.state.configDir);
      service.create([recipe]);
      ctx.response.redirect(
        urlWithParams(UrlGenerator.recipe(recipe), {
          "flash": "createSuccessful",
        }, ctx.request.url),
      );
    },
  )
  .get(
    "/:id/:slug/delete",
    async (ctx: Oak.Context<AppState>, next: () => Promise<void>) => {
      const service = services.get(RecipeService);
      const recipe = service.find(
        toNumber(ctx.parameter("id")),
      );
      if (!recipe) {
        await next();
      } else {
        ctx.response.body = RecipeDeleteTemplate(recipe);
      }
    },
  )
  .post(
    "/:id/:slug/delete",
    async (ctx: Oak.Context<AppState>, next: () => Promise<void>) => {
      const service = services.get(RecipeService);
      const recipe = service.find(
        toNumber(ctx.parameter("id")),
      );
      if (!recipe) {
        await next();
      } else {
        await deleteThumbnail(recipe, ctx.state.configDir);
        service.delete([recipe]);
        ctx.response.redirect(
          urlWithParams(UrlGenerator.recipeList(), {
            "flash": "deleteSuccessful",
          }, ctx.request.url),
        );
      }
    },
  )
  .get(
    "/:id/:slug",
    async (ctx: Oak.Context<AppState>, next: () => Promise<void>) => {
      const service = services.get(RecipeService);
      const recipe = service.find(
        toNumber(ctx.parameter("id")),
        true,
        true,
        true,
      );
      if (!recipe) {
        await next();
      } else {
        ctx.response.body = RecipeDetailTemplate(
          recipe,
          toNumber(ctx.parameter("portions"), recipe.yield),
        );
      }
    },
  );

export { router as RecipeRouter };
