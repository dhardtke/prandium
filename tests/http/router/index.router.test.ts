import { Oak } from "../../../deps-oak.ts";
import { assertEquals } from "../../../deps.ts";
import { IndexController } from "../../../src/controllers/index.controller.ts";
import { PaginationParams } from "../../../src/data/pagination.ts";
import { OrderBy } from "../../../src/data/service/util/order-by.ts";
import { PaginationHelper } from "../../../src/http/middleware/helpers/pagination-helper.ts";
import { DEFAULT_ORDER_BY, IndexRouter } from "../../../src/http/routers/index.router.ts";

Deno.test("IndexRouter", async (t) => {
  let lastListInvocation: {
    filters: {
      tagIds: number[];
      title: string;
    };
    showTagFilter: boolean;
    orderBy: OrderBy | undefined;
    paginationParams: PaginationParams;
  } | undefined = undefined;

  const mockIndexController: IndexController = {
    list(filters: { tagIds: number[]; title: string }, showTagFilter: boolean, orderBy: OrderBy | undefined, paginationParams: PaginationParams) {
      lastListInvocation = { filters, showTagFilter, orderBy, paginationParams };
      return "";
    },
  } as unknown as IndexController;

  const pageSize = 25;
  const mockPaginationHelper = {
    buildPaginationParams(ctx: Oak.Context): PaginationParams {
      return { page: 1, pageSize, currentUrl: ctx.request.url.toString() };
    },
  } as unknown as PaginationHelper;

  async function invokeRoute(path: string) {
    const ctx = Oak.testing.createMockContext({ method: "GET", path });
    const next = Oak.testing.createMockNext();
    const mw = new IndexRouter(mockPaginationHelper, mockIndexController).routes();
    await mw(ctx, next);
  }

  await t.step("when given no parameters, uses default parameters", async () => {
    await invokeRoute("/");

    assertEquals(lastListInvocation, {
      filters: { tagIds: [], title: "" },
      showTagFilter: false,
      orderBy: DEFAULT_ORDER_BY,
      paginationParams: { page: 1, pageSize, currentUrl: "http://localhost/" },
    });
  });

  await t.step("when given filters, passes them to the controller", async () => {
    const path = "/?tagId=1&tagId=2&tagId=3&tagId=4&tagId=5&tagId=6&tagId=9&title=lorem+ipsum";
    await invokeRoute(path);

    assertEquals(
      lastListInvocation,
      {
        filters: { tagIds: [1, 2, 3, 4, 5, 6, 9], title: "lorem ipsum" },
        showTagFilter: false,
        orderBy: DEFAULT_ORDER_BY,
        paginationParams: { page: 1, pageSize, currentUrl: `http://localhost${path}` },
      },
    );
  });
});
