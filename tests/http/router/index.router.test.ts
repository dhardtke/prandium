import { beforeEach, describe, expect, test } from "bun:test";
import { IndexController } from "../../../src/controllers/index.controller.ts";
import { PaginationParams } from "../../../src/data/pagination.ts";
import { OrderBy } from "../../../src/data/service/util/order-by.ts";
import { PaginationHelper } from "../../../src/http/middleware/helpers/pagination-helper.ts";
import { DEFAULT_ORDER_BY, IndexRouter } from "../../../src/http/routers/index.router.ts";
import { toAppRequest } from "../../../src/http/server/request.ts";

describe("IndexRouter", () => {
    let lastListInvocation:
        | {
              filters: {
                  tagIds: number[];
                  title: string;
              };
              showTagFilter: boolean;
              orderBy: OrderBy | undefined;
              paginationParams: PaginationParams;
          }
        | undefined = undefined;

    beforeEach(() => {
        lastListInvocation = undefined;
    });

    const mockIndexController: IndexController = {
        list(filters: { tagIds: number[]; title: string }, showTagFilter: boolean, orderBy: OrderBy | undefined, paginationParams: PaginationParams) {
            lastListInvocation = { filters, showTagFilter, orderBy, paginationParams };
            return "<html></html>";
        },
    } as unknown as IndexController;

    const pageSize = 25;
    const mockPaginationHelper = {
        buildPaginationParams(url: URL): PaginationParams {
            return { page: 1, pageSize, currentUrl: url.toString() };
        },
    } as unknown as PaginationHelper;

    async function invokeRoute(path: string): Promise<Response> {
        const handler = new IndexRouter(mockPaginationHelper, mockIndexController).routes()["/"].GET!;
        return await handler(toAppRequest(new Request(`http://localhost${path}`)));
    }

    test("when given no parameters, uses default parameters", async () => {
        const response = await invokeRoute("/");

        expect(response.headers.get("Content-Type")).toEqual("text/html; charset=utf-8");
        expect(await response.text()).toEqual("<html></html>");
        expect(lastListInvocation).toEqual({
            filters: { tagIds: [], title: "" },
            showTagFilter: false,
            orderBy: DEFAULT_ORDER_BY,
            paginationParams: { page: 1, pageSize, currentUrl: "http://localhost/" },
        });
    });

    test("when given filters, passes them to the controller", async () => {
        const path = "/?tagId=1&tagId=2&tagId=3&tagId=4&tagId=5&tagId=6&tagId=9&title=lorem+ipsum";
        await invokeRoute(path);

        expect(lastListInvocation).toEqual({
            filters: { tagIds: [1, 2, 3, 4, 5, 6, 9], title: "lorem ipsum" },
            showTagFilter: false,
            orderBy: DEFAULT_ORDER_BY,
            paginationParams: { page: 1, pageSize, currentUrl: `http://localhost${path}` },
        });
    });
});
