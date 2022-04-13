// noinspection SqlResolve

import { assertEquals, assertThrows, unreachable } from "../../deps.ts";
import { Database } from "../../src/data/db.ts";
import { disableLogging } from "../_internal/disable_logging.ts";
import { flushAllTables } from "../_internal/flush_all_tables.ts";

Deno.test("database", async (t) => {
  await disableLogging();

  const db = new Database(":memory:");

  db.exec(
    "CREATE TABLE book (id INTEGER PRIMARY KEY, title TEXT NOT NULL)",
  );

  await t.step("query", () => {
    assertThrows(() => {
      for (const _row of db.query("SELECT foo FROM bar")) {
        unreachable();
      }
    });
  });
  flushAllTables(db);

  await t.step("exec", () => {
    db.exec(
      "INSERT INTO book (title) VALUES ('Lorem Ipsum'), ('Ipsum Lorem')",
    );
    const rows = [...db.query("SELECT id, title FROM book")];
    assertEquals(rows, [
      { id: 1, title: "Lorem Ipsum" },
      {
        id: 2,
        title: "Ipsum Lorem",
      },
    ]);
  });
  flushAllTables(db);

  await t.step("single", () => {
    db.exec(
      "INSERT INTO book (title) VALUES ('Lorem Ipsum'), ('Ipsum Lorem')",
    );
    const row = db.single("SELECT id, title FROM book");
    assertEquals(row, { id: 1, title: "Lorem Ipsum" });
  });
  flushAllTables(db);

  await t.step("prepare", () => {
    const titles = [...Array(10).keys()].map((i) => `Book ${i + 1}`);
    db.prepare<{ id: number }>(
      "INSERT INTO book (title) VALUES (:title) RETURNING id",
      (query) => {
        titles.forEach((title, i) => {
          assertEquals(query({ title }), [{ id: i + 1 }]);
        });
      },
    );
    const rows = [...db.query("SELECT id, title FROM book")];
    assertEquals(rows, titles.map((title, i) => ({ title, id: i + 1 })));
  });
  flushAllTables(db);

  db.close();
});
