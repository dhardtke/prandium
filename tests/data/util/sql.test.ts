import { assertEquals } from "../../../deps.ts";
import {
  buildFilters,
  buildOrderBySql,
  columns,
  EmptyFilter,
  EmptyOrderBy,
  placeholders,
} from "../../../src/data/util/sql.ts";

const TestPrefix = "[data/util/sql]";

Deno.test(`${TestPrefix} buildFilters should return EMPTY_FILTER when no filter is active`, () => {
  assertEquals(buildFilters(), EmptyFilter);
  assertEquals(buildFilters({ active: false, sql: () => "" }), EmptyFilter);
});

Deno.test(`${TestPrefix} buildFilters complex example`, () => {
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

Deno.test(`${TestPrefix} buildOrderBySql should return EMPTY_ORDER_BY if arg is undefined`, () => {
  assertEquals(buildOrderBySql(undefined, []), EmptyOrderBy);
});

Deno.test(`${TestPrefix} buildOrderBySql should return EMPTY_ORDER_BY if column is not allowed`, () => {
  assertEquals(
    buildOrderBySql({ column: "title" }, ["id", "updated_at"]),
    EmptyOrderBy,
  );
});

Deno.test(`${TestPrefix} buildOrderBySql should work with sane inputs`, () => {
  for (const order of [undefined, "asc", "desc"]) {
    const expected = `ORDER BY title${
      order && order !== "asc" ? ` ${order.toUpperCase()}` : ""
    }`;
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

Deno.test(`${TestPrefix} buildOrderBySql should sanitize invalid order identifiers`, () => {
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
});

Deno.test(`${TestPrefix} columns`, () => {
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

Deno.test(`${TestPrefix} placeholders`, () => {
  assertEquals(placeholders(undefined), "");
  assertEquals(placeholders(3), "?, ?, ?");
  assertEquals(placeholders([1, 2, 3, 4]), "?, ?, ?, ?");
});
