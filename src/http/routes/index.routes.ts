import { Oak } from "../../deps.ts";
import { IndexTemplate } from "../../tpl/mod.ts";
import { AppState } from "../webserver.ts";

const router: Oak.Router = new Oak.Router();
router.get("/", async (ctx: Oak.Context<AppState>) => {
  await ctx.render(IndexTemplate, null);
});

export { router as IndexRouter };
