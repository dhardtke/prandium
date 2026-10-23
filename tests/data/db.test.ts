// noinspection SqlResolve

import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, mock, test } from "bun:test";
import path from "node:path";
import { Database } from "../../src/data/db.ts";
import { Migration } from "../../src/data/migrations/migration.ts";
import { MIGRATIONS } from "../../src/data/migrations/mod.ts";
import { Recipe } from "../../src/data/model/recipe.ts";
import { RecipeService } from "../../src/data/service/recipe.service.ts";
import { TagService } from "../../src/data/service/tag.service.ts";
import { disableLogging } from "../_internal/disable-logging.ts";
import { flushAllTables } from "../_internal/flush-all-tables.ts";
import { withTemp } from "../_internal/with-temp.function.ts";

beforeAll(() => {
    disableLogging();
});

describe("database", () => {
    const db = new Database(":memory:");

    db.exec(
        "CREATE TABLE book (id INTEGER PRIMARY KEY, title TEXT NOT NULL)",
    );

    afterEach(() => {
        flushAllTables(db);
    });

    afterAll(() => {
        db.close();
    });

    test("query", () => {
        expect(() => db.query("SELECT foo FROM bar")).toThrow();
    });

    test("exec", () => {
        db.exec(
            "INSERT INTO book (title) VALUES ('Lorem Ipsum'), ('Ipsum Lorem')",
        );
        const rows = [...db.query("SELECT id, title FROM book")];
        expect(rows).toEqual([
            { id: 1, title: "Lorem Ipsum" },
            {
                id: 2,
                title: "Ipsum Lorem",
            },
        ]);
    });

    test("single", () => {
        db.exec(
            "INSERT INTO book (title) VALUES ('Lorem Ipsum'), ('Ipsum Lorem')",
        );
        const row = db.single("SELECT id, title FROM book");
        expect(row).toEqual({ id: 1, title: "Lorem Ipsum" });
    });

    test("prepare", () => {
        const titles = [...Array(10).keys()].map((i) => `Book ${i + 1}`);
        db.prepare<{ id: number }>(
            "INSERT INTO book (title) VALUES (:title) RETURNING id",
            (query) => {
                titles.forEach((title, i) => {
                    expect(query({ title })).toEqual([{ id: i + 1 }]);
                });
            },
        );
        const rows = [...db.query("SELECT id, title FROM book")];
        expect(rows).toEqual(titles.map((title, i) => ({ title, id: i + 1 })));
    });

    test("Date values are bound as ISO strings and undefined values as NULL", () => {
        const date = new Date("2020-01-02T03:04:05.678Z");
        expect(db.single("SELECT ? AS date, ? AS empty", [date, undefined])).toEqual({ date: date.toISOString(), empty: null });
    });
});

describe("Database with recipes", () => {
    const db = new Database(":memory:");
    db.migrate();
    const recipeService = new RecipeService(db, new TagService(db));

    afterAll(() => {
        db.close();
    });

    test("Given a recipe with Date fields and an undefined thumbnail When storing and loading it Then all fields are read back correctly", () => {
        // Given
        const createdAt = new Date("2021-03-04T05:06:07.890Z");
        const updatedAt = new Date("2022-03-04T05:06:07.890Z");
        const cookedAt = new Date("2023-03-04T05:06:07.890Z");
        const recipe = new Recipe({ title: "Recipe", createdAt, updatedAt, history: [cookedAt], thumbnail: undefined });

        // When
        recipeService.create([recipe]);
        const loaded = recipeService.find(recipe.id!, false, true)!;

        // Then
        expect(loaded.title).toEqual("Recipe");
        expect(loaded.createdAt).toEqual(createdAt);
        expect(loaded.updatedAt).toEqual(updatedAt);
        expect(loaded.history).toEqual([cookedAt]);
        expect(loaded.thumbnail).toBeNull();
    });
});

describe("Database migrations", () => {
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

    beforeEach(() => {
        executions.length = 0;
    });

    test("Given migration1, migration2 Then migrations are executed in order and When migrating again Then no migrations are executed", () => {
        const db = new Database(":memory:", [migration2, migration1]);

        db.migrate();
        expect(executions).toEqual([1, 2]);

        db.migrate();
        expect(executions).toEqual([1, 2]);

        db.close();
    });

    test("Given migration1, migration2 and a database at version 1 Then only migration2 is executed", () => {
        const db = new Database(":memory:", [migration2, migration1]);
        db.exec("PRAGMA user_version = 1");
        db.migrate();
        expect(executions).toEqual([2]);
        db.close();
    });

    test("If one of multiple migrations fails successful operations within this failing migration are rolled back and an error is thrown", () => {
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
        expect(() => db.migrate()).toThrow();
        expect(executed).toEqual(true);
        expect(db.single("SELECT name FROM sqlite_master WHERE type='table' AND name='foo'")).toEqual({ name: "foo" });
        expect(db.single("SELECT name FROM sqlite_master WHERE type='table' AND name='bar'")).toBeUndefined();
        db.close();
    });

    test("All migrations run successfully", () => {
        const db = new Database(":memory:");
        db.migrate();
        db.close();
    });

    test(
        "Given a database file at the current schema version When reopening it Then no migration is executed and the data is readable",
        withTemp((tmpDir) => {
            // Given
            const dbPath = path.join(tmpDir, "data.db");
            const db = new Database(dbPath);
            db.migrate();
            new RecipeService(db, new TagService(db)).create([new Recipe({ title: "Existing recipe" })]);
            db.close();

            // When
            const migrations: Migration[] = MIGRATIONS.map((migration) => ({ ...migration, migrate: mock(migration.migrate) }));
            const reopened = new Database(dbPath, migrations);
            reopened.migrate();

            // Then
            for (const migration of migrations) {
                expect(migration.migrate).not.toHaveBeenCalled();
            }
            expect(reopened.single("PRAGMA user_version")).toEqual({ user_version: MIGRATIONS.length });
            expect(new RecipeService(reopened, new TagService(reopened)).list().map((r) => r.title)).toEqual(["Existing recipe"]);
            reopened.close();
        }),
    );
});
