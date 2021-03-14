import { Oak } from "../../deps.ts";
import { RecipeDetailTemplate, RecipeListTemplate } from "../../tpl/mod.ts";
import { AppState } from "../webserver.ts";
import { Recipe } from "../../data/model/recipe.ts";
import { RecipeService } from "../../data/service/recipe_service.ts";

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
    const recipe = new Recipe({ name: "Hello", bookId: 42 });
    service.save(recipe);
    // TODO redirect to created recipe
  })
  .get("/:id", async (ctx) => {
    await ctx.render(RecipeDetailTemplate, {
      recipe: new Recipe({ name: "Hello", bookId: 42 }),
    });
  });

export { router as RecipeRouter };
