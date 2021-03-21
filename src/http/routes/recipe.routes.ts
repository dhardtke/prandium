import { toInt } from "../../data/convert.ts";
import { importRecipes } from "../../data/parse/import_recipe.ts";
import { RecipeService } from "../../data/service/recipe_service.ts";
import { Oak } from "../../deps.ts";
import {
  RecipeDetailTemplate,
  RecipeImportTemplate,
  RecipeListTemplate,
} from "../../tpl/mod.ts";
import { UrlHelper } from "../url_helper.ts";
import { AppState } from "../webserver.ts";

// TODO slugs
const router: Oak.Router = new Oak.Router({ prefix: "/recipe" });
router
  .get("/", async (ctx: Oak.Context<AppState>) => {
    const service: RecipeService = ctx.state.services.RecipeService;
    const recipes = ctx.paginate(
      service.count(),
      (l, o) =>
        service.list(
          l,
          o,
          ctx.orderBy(),
        ),
    );
    await ctx.render(RecipeListTemplate, { recipes });
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
      const results = await importRecipes(
        urls!.split("\n"),
        ctx.configDir(),
      );
      const service = ctx.state.services.RecipeService;
      for (const result of results) {
        if (result.success) {
          service.create(result.recipe!);
        }
        // TODO bulk insert
      }
      await ctx.render(RecipeImportTemplate, { results });
    },
  )
  .get(
    "/:id/:slug",
    async (ctx: Oak.Context<AppState>, next: () => Promise<void>) => {
      const service = ctx.state.services.RecipeService;
      const recipe = service.find(
        toInt(ctx.parameter("id")),
        true,
        true,
        true,
      );
      if (!recipe) {
        await next();
      } else {
        await ctx.render(RecipeDetailTemplate, {
          recipe,
          portions: toInt(ctx.parameter("portions"), recipe.yield),
        });
      }
    },
  );

export { router as RecipeRouter };
