import { assertEquals } from "../../../deps-test.ts";
import { buildFilters, buildOrderBySql, columns, EmptyFilter, EmptyOrderBy, placeholders } from "../../../src/data/util/sql.ts";

Deno.test("sql", async (t) => {
    await t.step(`buildFilters returns EMPTY_FILTER when no filter is active`, () => {
        assertEquals(buildFilters(), EmptyFilter);
        assertEquals(buildFilters({ active: false, sql: () => "" }), EmptyFilter);
    });

    await t.step(`buildFilters complex example`, () => {
        const filters = [
            { active: true, sql: () => "? = TRUE", bindings: () => ["TRUE"] },
            { active: false, sql: () => "? = FALSE", bindings: () => ["FALSE"] },
            { active: true, sql: () => "? < 42", bindings: () => ["41"] },
        ];
        assertEquals(buildFilters(...filters), {
            sql: "? = TRUE AND ? < 42",
            bindings: ["TRUE", "41"],
        });
    });

    await t.step(`buildOrderBySql returns EMPTY_ORDER_BY if arg is undefined`, () => {
        assertEquals(buildOrderBySql(undefined, []), EmptyOrderBy);
    });

    await t.step(`buildOrderBySql returns EMPTY_ORDER_BY if column is not allowed`, () => {
        assertEquals(
            buildOrderBySql({ column: "title" }, ["id", "updated_at"]),
            EmptyOrderBy,
        );
    });

    await t.step(`buildOrderBySql works with sane inputs`, () => {
        for (const order of [undefined, "asc", "desc"]) {
            const expected = `ORDER BY title${order && order !== "asc" ? ` ${order.toUpperCase()}` : ""}`;
            assertEquals(
                buildOrderBySql({ column: "title", order: order as "asc" }, ["title"]),
                expected,
            );
            assertEquals(
                buildOrderBySql(
                    { column: "title", order: order?.toUpperCase() as "asc" },
                    ["title"],
                ),
                expected,
            );
        }
    });

    await t.step(`buildOrderBySql sanitizes invalid order identifiers`, () => {
        assertEquals(
            buildOrderBySql({ column: "title", order: "" as "asc" }, ["title"]),
            "ORDER BY title",
        );
        assertEquals(
            buildOrderBySql({ column: "title", order: "foo" as "asc" }, ["title"]),
            "ORDER BY title",
        );
        assertEquals(
            buildOrderBySql({ column: "title", order: "bar" as "asc" }, ["title"]),
            "ORDER BY title",
        );
        assertEquals(
            buildOrderBySql({ column: "foo", order: "asc" }, ["title"]),
            "ORDER BY TRUE",
        );
    });

    await t.step(`columns`, () => {
        assertEquals(columns([]), "");
        assertEquals(
            columns([undefined, undefined, "id", undefined, "title"]),
            "id, title",
        );
        assertEquals(columns(["id", "title"], "recipe."), "recipe.id, recipe.title");
        assertEquals(
            columns(["id", "title"], undefined, "r_"),
            "id AS r_id, title AS r_title",
        );
        assertEquals(
            columns(["id", "title"], "recipe.", "r_"),
            "recipe.id AS r_id, recipe.title AS r_title",
        );
    });

    await t.step(`placeholders`, () => {
        assertEquals(placeholders(undefined), "");
        assertEquals(placeholders(3), "?, ?, ?");
        assertEquals(placeholders([1, 2, 3, 4]), "?, ?, ?, ?");
    });
});
