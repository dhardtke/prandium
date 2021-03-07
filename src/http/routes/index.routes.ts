import {Oak} from "../../deps.ts";
import {IndexTemplate} from "../../tpl/mod.ts";

const router: Oak.Router = new Oak.Router();
router.get("/", async ctx => {
    ctx.response.body = await IndexTemplate.render({favoriteCake: "Bla"});
});

export {router as IndexRouter};
