import { describe, expect, test } from "bun:test";
import { type Settings } from "../../../../src/data/settings.ts";
import { PaginationHelper } from "../../../../src/http/middleware/helpers/pagination-helper.ts";

describe("PaginationHelper", () => {
    const settings: Settings = {
        pageSize: 12,
    } as Settings;

    test("buildPaginationParams uses pageSize from settings if parameter is not set", () => {
        const params = new PaginationHelper(settings).buildPaginationParams(new URL("http://localhost/"));
        expect(params.pageSize).toEqual(settings.pageSize);
    });

    test("buildPaginationParams removes the flash parameter from the current URL", () => {
        const params = new PaginationHelper(settings).buildPaginationParams(new URL("http://localhost/?flash=delete&id=42"));
        expect(params.currentUrl).toEqual("http://localhost/?id=42");
    });

    test("buildPaginationParams sets page to 1 if parameter is not present", () => {
        const params = new PaginationHelper(settings).buildPaginationParams(new URL("http://localhost/"));
        expect(params.page).toEqual(1);
    });

    test("buildPaginationParams uses pageSize from URL if present", () => {
        const params = new PaginationHelper(settings).buildPaginationParams(new URL("http://localhost/?pageSize=25"));
        expect(params.pageSize).toEqual(25);
    });

    test("buildPaginationParams uses page from URL if present", () => {
        const params = new PaginationHelper(settings).buildPaginationParams(new URL("http://localhost/?page=3"));
        expect(params.page).toEqual(3);
    });
});
