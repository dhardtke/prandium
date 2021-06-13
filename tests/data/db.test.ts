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
  async beforeEach(context) {
    context.dir = await Deno.makeTempDir({ prefix: "db.test" });
    context.db = new Database(context.dir);
  },
  async afterEach(context) {
    context.db.close();
    await Deno.remove(context.dir, { recursive: true });
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
  assertEquals(rows, [{ id: 1, title: "Lorem Ipsum" }, {
    id: 2,
    title: "Ipsum Lorem",
  }]);
});

test(baseSuite, "prepare", (context) => {
  context.db.exec(
    "CREATE TABLE book (id INTEGER PRIMARY KEY, title TEXT NOT NULL)",
  );
  const titles = [...Array(10).keys()].map((i) => `Book ${i + 1}`);
  context.db.prepare("INSERT INTO book (title) VALUES (:title)", (query) => {
    titles.forEach((title) => query({ title }));
  });
  const rows = [...context.db.query("SELECT id, title FROM book")];
  assertEquals(rows, titles.map((title, i) => ({ title, id: i + 1 })));
});

/*
const migrationSuite = new TestSuite({
  name: "migration",
  suite: baseSuite
});

test(migrationSuite, "no migrations should be executed if current version equals latest version", (context) => {
});
*/
