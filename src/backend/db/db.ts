import { Database } from 'bun:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { type MigrateOptions, migrate } from './migrations.ts';

export type DB = Database;

export function openDatabase(path: string, options: Pick<MigrateOptions, 'onMigration' | 'onAdopt'> = {}): DB {
  const inMemory = path === ':memory:';
  if (!inMemory) {
    mkdirSync(dirname(path), { recursive: true });
  }

  const db = new Database(path, { create: true });
  db.run('PRAGMA journal_mode = WAL');
  db.run('PRAGMA foreign_keys = ON');
  db.run('PRAGMA busy_timeout = 5000');
  migrate(db, options);
  return db;
}

// Empties every table but the migration ledger, then runs `refill` in the same transaction, so a failing refill keeps the old data.
// Foreign keys go off because ON DELETE RESTRICT ignores deferral, so they are checked before the commit instead.
export function clearDatabase(db: DB, refill: () => void = () => {}): void {
  const tables = db.query<{ name: string }, []>("SELECT name FROM sqlite_master WHERE type = 'table' AND name <> 'schema_migrations'").all();
  db.run('PRAGMA foreign_keys = OFF');
  try {
    db.transaction(() => {
      for (const { name } of tables) {
        db.run(`DELETE FROM "${name}"`);
      }
      refill();
      if (db.query<unknown, []>('PRAGMA foreign_key_check').get() !== null) {
        throw new Error('Refill left a dangling foreign key');
      }
    })();
  } finally {
    db.run('PRAGMA foreign_keys = ON');
  }
}
