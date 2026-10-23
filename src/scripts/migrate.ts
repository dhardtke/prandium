import { mkdirSync } from 'node:fs';
import { basename } from 'node:path';
import { databasePath, loadConfig } from '../backend/config.ts';
import { openDatabase } from '../backend/db/db.ts';
import { schemaVersion } from '../backend/db/migrations.ts';

function main(): void {
  const config = loadConfig();
  const path = databasePath(config);
  console.log(`database: ${path}`);
  mkdirSync(config.configDir, { recursive: true });

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
