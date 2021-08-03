// noinspection SqlResolve

import {
  assertEquals,
  assertThrows,
  test,
  TestSuite,
  unreachable,
} from "../../deps.ts";
import { Database } from "../../src/data/db.ts";
import { disableLogging } from "../_internal/disable_logging.ts";

// noinspection JSUnusedGlobalSymbols
const baseSuite: TestSuite<{ dir: string; db: Database }> = new TestSuite({
  name: "database",
  async beforeAll() {
    await disableLogging();
  },
  beforeEach(context) {
    context.db = new Database(":memory:");
  },
  afterEach(context) {
    context.db.close();
  },
});

test(baseSuite, "query", (context) => {
  assertThrows(() => {
    for (const _row of context.db.query("SELECT foo FROM bar")) {
      unreachable();
    }
  });
});

test(baseSuite, "exec", (context) => {
  context.db.exec(
    "CREATE TABLE book (id INTEGER PRIMARY KEY, title TEXT NOT NULL)",
  );
  context.db.exec(
    "INSERT INTO book (title) VALUES ('Lorem Ipsum'), ('Ipsum Lorem')",
  );
  const rows = [...context.db.query("SELECT id, title FROM book")];
  assertEquals(rows, [
    { id: 1, title: "Lorem Ipsum" },
    {
      id: 2,
      title: "Ipsum Lorem",
    },
  ]);
});

test(baseSuite, "single", (context) => {
  context.db.exec(
    "CREATE TABLE book (id INTEGER PRIMARY KEY, title TEXT NOT NULL)",
  );
  context.db.exec(
    "INSERT INTO book (title) VALUES ('Lorem Ipsum'), ('Ipsum Lorem')",
  );
  const row = context.db.single("SELECT id, title FROM book");
  assertEquals(row, { id: 1, title: "Lorem Ipsum" });
});

test(baseSuite, "prepare", (context) => {
  context.db.exec(
    "CREATE TABLE book (id INTEGER PRIMARY KEY, title TEXT NOT NULL)",
  );
  const titles = [...Array(10).keys()].map((i) => `Book ${i + 1}`);
  context.db.prepare<{ id: number }>(
    "INSERT INTO book (title) VALUES (:title) RETURNING id",
    (query) => {
      titles.forEach((title, i) => {
        assertEquals(query({ title }), [{ id: i + 1 }]);
      });
    },
  );
  const rows = [...context.db.query("SELECT id, title FROM book")];
  assertEquals(rows, titles.map((title, i) => ({ title, id: i + 1 })));
});

// TODO missing tests:
// TODO - migrations
// TODO - transaction

/*
const migrationSuite = new TestSuite({
  name: "migration",
  suite: baseSuite
});

test(migrationSuite, "no migrations should be executed if current version equals latest version", (context) => {
});
*/
