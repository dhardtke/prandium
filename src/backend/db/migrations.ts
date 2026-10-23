import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { EMBEDDED } from '../shared/embedded.ts';
import type { DB } from './db.ts';

export interface MigrationSource {
  filename: string;
  sql: string;
}

export interface Migration {
  version: number;
  name: string;
  file: string;
  sql: string;
}

export interface MigrateResult {
  version: number;
  applied: Migration[];
}

export interface MigrateOptions {
  /** Only the tests override this; a built file reads the embedded list. */
  dir?: string;
  onMigration?: (migration: Migration) => void;
  onAdopt?: (version: number) => void;
}

export const MIGRATIONS_DIR = resolve(import.meta.dir, 'migrations');

const LEDGER = `
CREATE TABLE IF NOT EXISTS schema_migrations (
  version    INTEGER PRIMARY KEY,
  name       TEXT    NOT NULL,
  applied_at TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);
`;

const FILENAME = /^(\d{3,})-([a-z0-9]+(?:-[a-z0-9]+)*)\.sql$/;

interface AppliedRow {
  version: number;
  name: string;
}

export function schemaVersion(db: DB): number {
  if (!hasLedger(db)) {
    return 0;
  }
  return db.query<{ version: number | null }, []>('SELECT MAX(version) AS version FROM schema_migrations').get()?.version ?? 0;
}

export function readMigrations(dir: string): MigrationSource[] {
  return readdirSync(dir)
    .filter((entry) => entry.endsWith('.sql'))
    .map((filename) => ({ filename, sql: readFileSync(join(dir, filename), 'utf8') }));
}

function discover(sources: MigrationSource[]): Migration[] {
  const found: Migration[] = [];
  const byVersion = new Map<number, string>();

  for (const { filename, sql } of sources) {
    const [, rawVersion, name] = FILENAME.exec(filename) ?? [];
    if (!rawVersion || !name) {
      throw new Error(`Migration ${filename} does not match <version>-<name>.sql, for example 006-add-recipe-notes.sql`);
    }

    const version = Number(rawVersion);
    if (version < 1) {
      throw new Error(`Migration ${filename} must be numbered from 001 upwards — version 0 means "never migrated"`);
    }

    const clash = byVersion.get(version);
    if (clash) {
      throw new Error(`Migrations "${clash}" and "${filename}" share version ${version}`);
    }
    byVersion.set(version, filename);

    found.push({ version, name, file: filename, sql });
  }

  return found.sort((a, b) => a.version - b.version);
}

// Applied versions must be an unbroken prefix of the files; any gap would silently skip migrations.
function pendingMigrations(files: Migration[], applied: AppliedRow[]): Migration[] {
  const highest = applied.at(-1)?.version ?? 0;
  for (const [i, row] of applied.entries()) {
    const file = files[i];
    if (!file || file.version > row.version) {
      throw new Error(
        `Database has migration ${row.version} (${row.name}) applied, but no migration file for it exists — the database is newer than this code`,
      );
    }
    if (file.version < row.version) {
      throw new Error(
        `Migration ${file.file} is numbered at or below the highest applied version (${highest}) but has never run — renumber it above ${highest}`,
      );
    }
  }
  return files.slice(applied.length);
}

function apply(db: DB, migration: Migration): void {
  try {
    db.transaction(() => {
      db.run(migration.sql);

      // prepare(), not query(): the schema just changed, so the statement cache is stale.
      const orphan = db.prepare<{ table: string }, []>('PRAGMA foreign_key_check').get();
      if (orphan) {
        throw new Error(`it left orphaned rows in "${orphan.table}"`);
      }

      db.query('INSERT INTO schema_migrations (version, name) VALUES (?, ?)').run(migration.version, migration.name);
    })();
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    throw new Error(`Migration ${migration.file} failed and was rolled back: ${reason}`, { cause: err });
  }
}

function hasLedger(db: DB): boolean {
  return db.query<{ name: string }, [string]>("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?").get('schema_migrations') !== null;
}

// Databases from before the ledger counted their migrations in PRAGMA user_version; those versions are recorded as applied without running.
function adoptUserVersion(db: DB, files: Migration[]): number {
  const version = db.query<{ user_version: number }, []>('PRAGMA user_version').get()?.user_version ?? 0;
  if (version <= 0 || hasLedger(db)) {
    return 0;
  }
  const adopted = files.filter((file) => file.version <= version);
  if (adopted.length !== version || adopted.some((file, i) => file.version !== i + 1)) {
    throw new Error(`Database has schema version ${version} in PRAGMA user_version, but migrations 001 to ${version} do not all exist`);
  }
  db.transaction(() => {
    db.run(LEDGER);
    for (const file of adopted) {
      db.query('INSERT INTO schema_migrations (version, name) VALUES (?, ?)').run(file.version, file.name);
    }
    db.run('PRAGMA user_version = 0');
  })();
  return version;
}

// Table rebuilds need foreign keys off, and `PRAGMA foreign_keys` is a no-op inside a transaction.
function withForeignKeysOff(db: DB, fn: () => void): void {
  db.run('PRAGMA foreign_keys = OFF;');
  try {
    fn();
  } finally {
    db.run('PRAGMA foreign_keys = ON;');
  }
}

export function migrate(db: DB, options: MigrateOptions = {}): MigrateResult {
  const sources = options.dir !== undefined ? readMigrations(options.dir) : (EMBEDDED?.migrations ?? readMigrations(MIGRATIONS_DIR));
  const files = discover(sources);

  const adopted = adoptUserVersion(db, files);
  if (adopted > 0) {
    options.onAdopt?.(adopted);
  }

  db.run(LEDGER);
  const previous = db.query<AppliedRow, []>('SELECT version, name FROM schema_migrations ORDER BY version').all();
  const pending = pendingMigrations(files, previous);
  if (pending.length === 0) {
    return { version: schemaVersion(db), applied: [] };
  }

  withForeignKeysOff(db, () => {
    for (const migration of pending) {
      apply(db, migration);
      options.onMigration?.(migration);
    }
  });

  return { version: schemaVersion(db), applied: pending };
}
