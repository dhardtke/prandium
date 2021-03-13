import { Oak } from "../../deps.ts";
import { RecipeDetailTemplate, RecipeListTemplate } from "../../tpl/mod.ts";

const router: Oak.Router = new Oak.Router({ prefix: "/book" });
router
  .get("/", async (ctx) => {
    // TODO list all books
    await ctx.render(RecipeListTemplate);
  })
  .get("/:id", async (ctx) => {
    await ctx.render(RecipeDetailTemplate);
  });

export { router as RecipeRouter };
