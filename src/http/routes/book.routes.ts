import { Oak } from "../../deps.ts";
import { BookDetailTemplate, BookListTemplate } from "../../tpl/mod.ts";
import { BookService } from "../../data/service/book_service.ts";
import { toInt } from "../../util.ts";
import { AppState } from "../webserver.ts";

const router: Oak.Router = new Oak.Router({ prefix: "/book" });
router
  .get("/", async (ctx: Oak.Context<AppState>) => {
    const service: BookService = ctx.state.services.BookService;
    const books = ctx.paginate(
      service.count(),
      (l, o) =>
        service.list(
          l,
          o,
          ctx.orderBy(),
        ),
    );
    await ctx.render(BookListTemplate, { books });
  })
  .get(
    "/:id",
    async (ctx: Oak.Context<AppState>, next: () => Promise<void>) => {
      const book = ctx.state.services.BookService.find(
        toInt(ctx.parameter("id")),
      );
      if (!book) {
        next();
      } else {
        const recipeService = ctx.state.services.RecipeService;
        book.recipes = ctx.paginate(
          recipeService.count({ bookId: book.id }),
          (l, o) =>
            recipeService.list(l, o, ctx.orderBy(), { bookId: book.id }),
        );
        await ctx.render(BookDetailTemplate, { book });
      }
    },
  );

export { router as BookRouter };
