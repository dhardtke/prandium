// noinspection SqlResolve

import { assertEquals, assertThrows, unreachable } from "../../deps.ts";
import { Database } from "../../src/data/db.ts";
import { disableLogging } from "../_internal/disable_logging.ts";

Deno.test("database", async (t) => {
  await disableLogging();

  const db = new Database(":memory:");

  db.exec(
    "CREATE TABLE book (id INTEGER PRIMARY KEY, title TEXT NOT NULL)",
  );

  const flush = () => {
    // noinspection SqlWithoutWhere
    db.exec("DELETE FROM book");
  };

  await t.step("query", () => {
    assertThrows(() => {
      for (const _row of db.query("SELECT foo FROM bar")) {
        unreachable();
      }
    });
  });
  flush();

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
  flush();

  await t.step("single", () => {
    db.exec(
      "INSERT INTO book (title) VALUES ('Lorem Ipsum'), ('Ipsum Lorem')",
    );
    const row = db.single("SELECT id, title FROM book");
    assertEquals(row, { id: 1, title: "Lorem Ipsum" });
  });
  flush();

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
  flush();

  db.close();
});
