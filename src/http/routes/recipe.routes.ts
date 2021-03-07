import {Oak} from "../../deps.ts";
import {RecipeTemplate} from "../../tpl/mod.ts";

const router: Oak.Router = new Oak.Router();
router.get("/recipe/:id", async (ctx) => {
    ctx.response.body = await RecipeTemplate.render();
});

export {router as RecipeRouter};
