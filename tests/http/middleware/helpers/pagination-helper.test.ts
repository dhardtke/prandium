import { assertEquals } from "../../../../deps.ts";
import { Oak } from "../../../../deps-oak.ts";
import { type Settings } from "../../../../src/data/settings.ts";
import { PaginationHelper } from "../../../../src/http/middleware/helpers/pagination-helper.ts";

Deno.test("PaginationHelper", async (t) => {
  const settings: Settings = {
    pageSize: 12,
  } as Settings;

  await t.step("buildPaginationParams should use pageSize from settings if parameter is not set", () => {
    const ctx = Oak.testing.createMockContext({ method: "GET", path: "/" });
    const params = new PaginationHelper(settings)
      .buildPaginationParams(ctx);
    assertEquals(params.pageSize, settings.pageSize);
  });

  await t.step("buildPaginationParams should remove the flash parameter from the current URL", () => {
    const ctx = Oak.testing.createMockContext({ method: "GET", path: "/?flash=delete&id=42" });
    const params = new PaginationHelper(settings)
      .buildPaginationParams(ctx);
    assertEquals(params.currentUrl, "http://localhost/?id=42");
  });

  await t.step("buildPaginationParams should set page to 1 if parameter is not present", () => {
    const ctx = Oak.testing.createMockContext({ method: "GET", path: "/" });
    const params = new PaginationHelper(settings)
      .buildPaginationParams(ctx);
    assertEquals(params.page, 1);
  });

  await t.step("buildPaginationParams should use pageSize from URL if present", () => {
    const ctx = Oak.testing.createMockContext({ method: "GET", path: "/?pageSize=25" });
    const params = new PaginationHelper(settings)
      .buildPaginationParams(ctx);
    assertEquals(params.pageSize, 25);
  });

  await t.step("buildPaginationParams should use page from URL if present", () => {
    const ctx = Oak.testing.createMockContext({ method: "GET", path: "/?page=3" });
    const params = new PaginationHelper(settings)
      .buildPaginationParams(ctx);
    assertEquals(params.page, 3);
  });
});
