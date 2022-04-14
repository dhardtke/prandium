// noinspection SqlResolve
import { assertEquals, assertThrows, unreachable } from "../../deps.ts";
import { Database } from "../../src/data/db.ts";
import { Migration } from "../../src/data/migrations/migration.ts";
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

Deno.test("Database migrations", async (t) => {
  await disableLogging();

  const executions: number[] = [];
  const migration1: Migration = {
    version: 1,
    name: "migration1",
    migrate() {
      executions.push(1);
    },
  };
  const migration2: Migration = {
    version: 2,
    name: "migration2",
    migrate() {
      executions.push(2);
    },
  };

  await t.step("Given migration1, migration2", async (t) => {
    const db = new Database(":memory:", [migration2, migration1]);
    await t.step("Migrations are executed in order", () => {
      db.migrate();

      assertEquals(executions, [1, 2]);
    });

    await t.step("When migrating again Then no migrations are executed", () => {
      db.migrate();
      assertEquals(executions, [1, 2]);
    });

    db.close();
  });
  executions.length = 0;

  await t.step("Given migration1, migration2", () => {
    const db = new Database(":memory:", [migration2, migration1]);
    db.exec("PRAGMA user_version = 1");
    db.migrate();
    assertEquals(executions, [2]);
    db.close();
  });
  executions.length = 0;

  await t.step("If one of multiple migrations fails successful operations within this failing migration are rolled back and an error is thrown", () => {
    let executed = false;
    const successfulMigration: Migration = {
      version: 1,
      name: "successfulMigration",
      migrate(db: Database) {
        db.exec("CREATE TABLE foo (id)");
      },
    };
    const failingMigration: Migration = {
      version: 2,
      name: "failingMigration",
      migrate(db: Database) {
        executed = true;
        db.exec("CREATE TABLE bar (id)");
        db.exec("FAIL");
      },
    };

    const db = new Database(":memory:", [successfulMigration, failingMigration]);
    assertThrows(() => db.migrate());
    assertEquals(executed, true);
    assertEquals(db.single("SELECT name FROM sqlite_master WHERE type='table' AND name='foo'"), { name: "foo" });
    assertEquals(db.single("SELECT name FROM sqlite_master WHERE type='table' AND name='bar'"), undefined);
    db.close();
  });
});
