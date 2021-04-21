import { Oak } from "../../../deps.ts";
import { IndexTemplate } from "../../tpl/templates/index.template.ts";
import { AppState } from "../webserver.ts";

const router: Oak.Router = new Oak.Router();
router.get("/", (ctx: Oak.Context<AppState>) => {
  ctx.response.body = IndexTemplate();
});

export { router as IndexRouter };
