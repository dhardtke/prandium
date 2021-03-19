import { toInt } from "../../data/convert.ts";
import { Recipe } from "../../data/model/recipe.ts";
import { RecipeService } from "../../data/service/recipe_service.ts";
import { Oak } from "../../deps.ts";
import { RecipeDetailTemplate, RecipeListTemplate } from "../../tpl/mod.ts";
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
  .get("/add", async (ctx: Oak.Context<AppState>) => {
    // TODO show form
  })
  .post("/add", (ctx: Oak.Context<AppState>) => {
    const service = ctx.state.services.RecipeService;
    const recipe = new Recipe({ title: "Hello", source: "" });
    service.create(recipe);
    // TODO redirect to created recipe
  })
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
