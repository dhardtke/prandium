import { TagService } from "../../data/service/tag.service.ts";
import { Oak } from "../../deps.ts";
import { AppState } from "../webserver.ts";

const router: Oak.Router = new Oak.Router({ prefix: "/tag" });
router
  .get("/filter", (ctx: Oak.Context<AppState>) => {
    const service: TagService = ctx.state.services.TagService;

    const tagIds = ctx.request.url.searchParams.getAll("tagId").map((id) =>
      parseInt(id, 10)
    );
    const tags = service.list({
      orderBy: { title: false },
      loadRecipeCount: true,
      filters: {
        tagsWithSameRecipes: {
          ids: tagIds,
          includeOthers: true,
        },
      },
    });

    ctx.response.type = "json";
    ctx.response.body = JSON.stringify(tags);
  });

export { router as TagRouter };