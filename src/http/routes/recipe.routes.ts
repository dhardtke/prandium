import { Oak } from "../../../deps.ts";
import { importRecipes } from "../../data/parse/import_recipe.ts";
import { RecipeService } from "../../data/service/recipe.service.ts";
import { toInt } from "../../data/util/convert.ts";
import {
  RecipeDetailTemplate,
  RecipeImportTemplate,
  RecipeListTemplate,
} from "../../tpl/mod.ts";
import { AppState } from "../webserver.ts";

const router: Oak.Router = new Oak.Router({ prefix: "/recipe" });
router
  .get("/", async (ctx: Oak.Context<AppState>) => {
    const service: RecipeService = ctx.state.services.RecipeService;

    const tagIds = ctx.request.url.searchParams.getAll("tagId").map((id) =>
      toInt(id, -1)
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
      const results = await importRecipes(
        urls!.split("\n"),
        ctx.configDir(),
      );
      const service = ctx.state.services.RecipeService;
      service.create(results.filter((r) => r.success).map((r) => r.recipe!));
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
