import { describe, expect, test } from "bun:test";
import { buildFilters, buildOrderBySql, columns, EmptyFilter, EmptyOrderBy, placeholders } from "../../../src/data/util/sql.ts";

describe("sql", () => {
    test(`buildFilters returns EMPTY_FILTER when no filter is active`, () => {
        expect(buildFilters()).toEqual(EmptyFilter);
        expect(buildFilters({ active: false, sql: () => "" })).toEqual(EmptyFilter);
    });

    test(`buildFilters complex example`, () => {
        const filters = [
            { active: true, sql: () => "? = TRUE", bindings: () => ["TRUE"] },
            { active: false, sql: () => "? = FALSE", bindings: () => ["FALSE"] },
            { active: true, sql: () => "? < 42", bindings: () => ["41"] },
        ];
        expect(buildFilters(...filters)).toEqual({
            sql: "? = TRUE AND ? < 42",
            bindings: ["TRUE", "41"],
        });
    });

    test(`buildOrderBySql returns EMPTY_ORDER_BY if arg is undefined`, () => {
        expect(buildOrderBySql(undefined, [])).toEqual(EmptyOrderBy);
    });

    test(`buildOrderBySql returns EMPTY_ORDER_BY if column is not allowed`, () => {
        expect(buildOrderBySql({ column: "title" }, ["id", "updated_at"])).toEqual(EmptyOrderBy);
    });

    test(`buildOrderBySql works with sane inputs`, () => {
        for (const order of [undefined, "asc", "desc"]) {
            const expected = `ORDER BY title${order && order !== "asc" ? ` ${order.toUpperCase()}` : ""}`;
            expect(buildOrderBySql({ column: "title", order: order as "asc" }, ["title"])).toEqual(expected);
            expect(buildOrderBySql(
                    { column: "title", order: order?.toUpperCase() as "asc" },
                    ["title"],
                )).toEqual(expected);
        }
    });

    test(`buildOrderBySql sanitizes invalid order identifiers`, () => {
        expect(buildOrderBySql({ column: "title", order: "" as "asc" }, ["title"])).toEqual("ORDER BY title");
        expect(buildOrderBySql({ column: "title", order: "foo" as "asc" }, ["title"])).toEqual("ORDER BY title");
        expect(buildOrderBySql({ column: "title", order: "bar" as "asc" }, ["title"])).toEqual("ORDER BY title");
        expect(buildOrderBySql({ column: "foo", order: "asc" }, ["title"])).toEqual("ORDER BY TRUE");
    });

    test(`columns`, () => {
        expect(columns([])).toEqual("");
        expect(columns([undefined, undefined, "id", undefined, "title"])).toEqual("id, title");
        expect(columns(["id", "title"], "recipe.")).toEqual("recipe.id, recipe.title");
        expect(columns(["id", "title"], undefined, "r_")).toEqual("id AS r_id, title AS r_title");
        expect(columns(["id", "title"], "recipe.", "r_")).toEqual("recipe.id AS r_id, recipe.title AS r_title");
    });

    test(`placeholders`, () => {
        expect(placeholders(undefined)).toEqual("");
        expect(placeholders(3)).toEqual("?, ?, ?");
        expect(placeholders([1, 2, 3, 4])).toEqual("?, ?, ?, ?");
    });
});
