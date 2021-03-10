import {Oak} from "../../deps.ts";
import {RecipeDetailTemplate, RecipeListTemplate} from "../../tpl/mod.ts";
import {AppState} from "../webserver.ts";
import {Recipe} from "../../data/model/recipe.ts";
import {RecipeService} from "../../data/service/RecipeService.ts";
import {paginationRequest} from "../util.ts";

const router: Oak.Router = new Oak.Router({prefix: "/recipe"});
router
    .get("/", async (ctx: Oak.Context<AppState>) => {
        const service: RecipeService = ctx.state.services.RecipeService;
        const pagination = paginationRequest(ctx);
        const recipes = service.list(pagination);
        console.log(service.paginationInfo(pagination));
        await ctx.render(RecipeListTemplate, {recipes});
    })
    .get("/add", async (ctx) => {
        // TODO show form
    })
    .post("/add", async (ctx) => {
        const service = ctx.state.services.RecipeService;
        const recipe = new Recipe({name: "Hello"});
        service.save(recipe);
        // TODO redirect to created recipe
    })
    .get("/:id", async (ctx) => {
        await ctx.render(RecipeDetailTemplate);
    });

export {router as RecipeRouter};
