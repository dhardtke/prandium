import {Oak} from "../../deps.ts";
import {RecipeTemplate} from "../../tpl/mod.ts";

const router: Oak.Router = new Oak.Router();
router.get("/recipe/:id", async (ctx) => {
    await ctx.render(RecipeTemplate);
});

export {router as RecipeRouter};
