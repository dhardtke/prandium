import { Recipe } from "../../data/model/recipe.ts";
import { Oak } from "../../deps.ts";
import { RecipeDetailTemplate } from "../../tpl/mod.ts";
import { toInt } from "../../util.ts";
import { AppState } from "../webserver.ts";

// TODO slugs
const router: Oak.Router = new Oak.Router({ prefix: "/book/:bookId/recipe" });
router
  .get("/add", async (ctx: Oak.Context<AppState>) => {
    // TODO show form
  })
  .post("/add", (ctx: Oak.Context<AppState>) => {
    const service = ctx.state.services.RecipeService;
    const recipe = new Recipe({ name: "Hello", bookId: 42 });
    service.save(recipe);
    // TODO redirect to created recipe
  })
  .get("/:id", async (ctx: Oak.Context<AppState>, next: () => Promise<void>) => {
    const service = ctx.state.services.RecipeService;
    const recipe = service.find(
      toInt(ctx.parameter("id")),
      true
    );
    if (!recipe) {
      await next();
    } else {
      await ctx.render(RecipeDetailTemplate, {
        recipe,
      });
    }
  });

export { router as RecipeRouter };
