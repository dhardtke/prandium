import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { Database } from 'bun:sqlite';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { migrate, type MigrateResult, MIGRATIONS_DIR, readMigrations, schemaVersion } from './migrations.ts';
import { at, tables, useTempDir } from '../testing.ts';

const tempDir = useTempDir();
let db: Database;

beforeEach(() => {
  db = new Database(':memory:', { create: true });
  db.run('PRAGMA foreign_keys = ON;');
});

afterEach(() => {
  db.close();
});

function write(filename: string, sql: string): void {
  writeFileSync(join(tempDir(), filename), sql);
}

function run(): MigrateResult {
  return migrate(db, { dir: tempDir() });
}

function foreignKeysOn(database: Database): boolean {
  return database.prepare<{ foreign_keys: number }, []>('PRAGMA foreign_keys').get()?.foreign_keys === 1;
}

describe('migration runner', () => {
  test('applies every migration to a fresh database, in version order', () => {
    write('002-add-color.sql', 'ALTER TABLE widgets ADD COLUMN color TEXT;');
    write('001-create-widgets.sql', 'CREATE TABLE widgets (id INTEGER PRIMARY KEY, name TEXT NOT NULL);');

    const result = run();

    expect(result.applied.map((migration) => migration.version)).toEqual([1, 2]);
    expect(result.applied.map((migration) => migration.name)).toEqual(['create-widgets', 'add-color']);
    expect(result.version).toBe(2);
    expect(db.query('SELECT color FROM widgets').all()).toEqual([]);
  });

  test('is a no-op on an already-migrated database', () => {
    write('001-create-widgets.sql', 'CREATE TABLE widgets (id INTEGER PRIMARY KEY);');
    run();

    const again = run();

    expect(again.applied).toEqual([]);
    expect(again.version).toBe(1);
  });

  test('applies only the pending migrations', () => {
    write('001-create-widgets.sql', 'CREATE TABLE widgets (id INTEGER PRIMARY KEY);');
    run();

    write('002-add-color.sql', 'ALTER TABLE widgets ADD COLUMN color TEXT;');
    const result = run();

    expect(result.applied.map((migration) => migration.name)).toEqual(['add-color']);
    expect(result.version).toBe(2);
  });

  test('rolls back and rethrows when a migration fails part-way', () => {
    write('001-create-widgets.sql', 'CREATE TABLE widgets (id INTEGER PRIMARY KEY);');
    // Fails only after the DDL has taken effect, which is what makes it a rollback test.
    write('002-broken.sql', 'CREATE TABLE gadgets (id INTEGER PRIMARY KEY);\nINSERT INTO gadgets (id) VALUES (1);\nINSERT INTO gadgets (id) VALUES (1);');

    expect(() => run()).toThrow(/002-broken\.sql/);

    expect(schemaVersion(db)).toBe(1);
    expect(tables(db)).not.toContain('gadgets');
  });

  test('refuses a migration numbered at or below the highest applied version', () => {
    write('001-create-widgets.sql', 'CREATE TABLE widgets (id INTEGER PRIMARY KEY);');
    write('003-create-gadgets.sql', 'CREATE TABLE gadgets (id INTEGER PRIMARY KEY);');
    run();

    write('002-late-addition.sql', 'CREATE TABLE doodads (id INTEGER PRIMARY KEY);');

    expect(() => run()).toThrow(/002-late-addition\.sql/);
    expect(tables(db)).not.toContain('doodads');
  });

  test('refuses two migrations that share a version number', () => {
    write('001-create-widgets.sql', 'CREATE TABLE widgets (id INTEGER PRIMARY KEY);');
    write('001-create-gadgets.sql', 'CREATE TABLE gadgets (id INTEGER PRIMARY KEY);');

    expect(() => run()).toThrow(/share version 1/);
  });

  test('refuses a .sql file that is not named <version>-<name>.sql', () => {
    write('initial.sql', 'CREATE TABLE widgets (id INTEGER PRIMARY KEY);');

    expect(() => run()).toThrow(/initial\.sql/);
  });

  test('refuses a database that is newer than the checkout', () => {
    write('001-create-widgets.sql', 'CREATE TABLE widgets (id INTEGER PRIMARY KEY);');
    run();

    db.query('INSERT INTO schema_migrations (version, name) VALUES (?, ?)').run(99, 'add-programs');

    expect(() => run()).toThrow(/99 \(add-programs\)/);
  });

  test('refuses a database whose ledger has a version between two files', () => {
    write('001-create-widgets.sql', 'CREATE TABLE widgets (id INTEGER PRIMARY KEY);');
    write('003-create-gadgets.sql', 'CREATE TABLE gadgets (id INTEGER PRIMARY KEY);');
    run();

    db.query('INSERT INTO schema_migrations (version, name) VALUES (?, ?)').run(2, 'removed-file');

    expect(() => run()).toThrow(/2 \(removed-file\)/);
  });

  test('rolls back a migration that leaves orphaned rows', () => {
    write(
      '001-create-widgets.sql',
      `CREATE TABLE widgets (id INTEGER PRIMARY KEY);
       CREATE TABLE parts (id INTEGER PRIMARY KEY, widget_id INTEGER NOT NULL REFERENCES widgets (id));`,
    );
    run();

    // Foreign keys are off during the run, so only foreign_key_check catches this.
    write('002-orphan.sql', 'INSERT INTO parts (id, widget_id) VALUES (1, 404);');

    expect(() => run()).toThrow(/orphaned rows in "parts"/);
    expect(schemaVersion(db)).toBe(1);
    expect(db.query('SELECT id FROM parts').all()).toEqual([]);
  });

  test('leaves foreign keys on after a successful run and after a failed one', () => {
    write('001-create-widgets.sql', 'CREATE TABLE widgets (id INTEGER PRIMARY KEY);');
    run();
    expect(foreignKeysOn(db)).toBe(true);

    write('002-broken.sql', 'UPDATE nope SET x = 1;');
    expect(() => run()).toThrow();
    expect(foreignKeysOn(db)).toBe(true);
  });
});

describe('the real migrations', () => {
  test('are read from disk by bare filename, with their SQL', () => {
    const initial = readMigrations(MIGRATIONS_DIR).find((source) => source.filename === '001-initial-schema.sql');

    expect(initial?.sql).toContain('CREATE TABLE');
  });

  test('report what they applied by bare filename', () => {
    const fresh = new Database(':memory:', { create: true });

    const result = migrate(fresh);

    expect(at(result.applied, 0).file).toBe('001-initial-schema.sql');
    fresh.close();
  });

  function legacyDatabase(): Database {
    const legacy = new Database(':memory:', { create: true });
    for (const { sql } of readMigrations(MIGRATIONS_DIR)) {
      legacy.run(sql);
    }
    legacy.run('PRAGMA user_version = 5');
    return legacy;
  }

  test('adopt a database migrated by PRAGMA user_version without running anything', () => {
    const legacy = legacyDatabase();
    legacy.run("INSERT INTO recipe (title, prep_time) VALUES ('Carbonara', 10)");
    const adopted: number[] = [];
    const record = (version: number): void => {
      adopted.push(version);
    };

    const result = migrate(legacy, { onAdopt: record });

    expect(result).toEqual({ version: 5, applied: [] });
    expect(adopted).toEqual([5]);
    expect(legacy.query<{ version: number; name: string }, []>('SELECT version, name FROM schema_migrations ORDER BY version').all()).toEqual([
      { version: 1, name: 'initial-schema' },
      { version: 2, name: 'add-flag-column' },
      { version: 3, name: 'foreign-key-indexes' },
      { version: 4, name: 'times-seconds-to-minutes' },
      { version: 5, name: 'remove-tag-description' },
    ]);
    expect(legacy.query<{ title: string; prep_time: number }, []>('SELECT title, prep_time FROM recipe').all()).toEqual([
      { title: 'Carbonara', prep_time: 10 },
    ]);
    expect(legacy.query<{ user_version: number }, []>('PRAGMA user_version').get()?.user_version).toBe(0);

    legacy.close();
  });

  test('adopt only once', () => {
    const legacy = legacyDatabase();
    const adopted: number[] = [];
    const record = (version: number): void => {
      adopted.push(version);
    };
    migrate(legacy, { onAdopt: record });

    expect(migrate(legacy, { onAdopt: record }).applied).toEqual([]);

    expect(adopted).toEqual([5]);
    legacy.close();
  });

  test('refuse to adopt a user_version above the migration files', () => {
    const legacy = new Database(':memory:', { create: true });
    legacy.run('PRAGMA user_version = 9');

    expect(() => migrate(legacy)).toThrow(/user_version/);

    legacy.close();
  });

  test('record five ledger rows on a fresh database', () => {
    const fresh = new Database(':memory:', { create: true });

    expect(migrate(fresh).applied.map((migration) => migration.version)).toEqual([1, 2, 3, 4, 5]);

    expect(fresh.query<{ n: number }, []>('SELECT COUNT(*) AS n FROM schema_migrations').get()?.n).toBe(5);
    for (const table of ['recipe', 'tag', 'recipe_tag', 'recipe_history', 'recipe_review']) {
      expect(tables(fresh)).toContain(table);
    }
    fresh.close();
  });

  test('turn prep and cook times from seconds into minutes', () => {
    for (const file of readMigrations(MIGRATIONS_DIR).filter((source) => Number.parseInt(source.filename, 10) < 4)) {
      write(file.filename, file.sql);
    }
    const legacy = new Database(':memory:', { create: true });
    expect(migrate(legacy, { dir: tempDir() }).version).toBe(3);
    legacy.run("INSERT INTO recipe (title, prep_time, cook_time) VALUES ('Carbonara', 600, 900)");

    migrate(legacy);

    expect(legacy.query<{ prep_time: number; cook_time: number }, []>('SELECT prep_time, cook_time FROM recipe').get()).toEqual({
      prep_time: 10,
      cook_time: 15,
    });
    legacy.close();
  });
});
