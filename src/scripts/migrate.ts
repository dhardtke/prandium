import { mkdirSync } from 'node:fs';
import { basename, dirname } from 'node:path';
import { loadConfig } from '../backend/config.ts';
import { openDatabase } from '../backend/db/db.ts';
import { schemaVersion } from '../backend/db/migrations.ts';

function main(): void {
  const config = loadConfig();
  const path = config.databasePath;
  console.log(`database: ${path}`);
  mkdirSync(dirname(path), { recursive: true });

  let applied = 0;
  const db = openDatabase(path, {
    onMigration: (migration) => {
      applied++;
      console.log(`  applied ${basename(migration.file, '.sql')}`);
    },
    onAdopt: (version) => {
      console.log(`  adopted schema version ${version} from PRAGMA user_version`);
    },
  });

  const version = schemaVersion(db);
  console.log(applied > 0 ? `now at schema version ${version}` : `already at schema version ${version} — nothing to apply`);
  db.close();
}

if (import.meta.main) {
  main();
}
