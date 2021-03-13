import { Oak } from "../../deps.ts";
import { IndexTemplate } from "../../tpl/mod.ts";

const router: Oak.Router = new Oak.Router();
router.get("/", async (ctx) => {
  await ctx.render(IndexTemplate, { "favoriteCake": "Bla Bli" });
});

export { router as IndexRouter };
