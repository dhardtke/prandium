import { existsSync, mkdirSync } from 'node:fs';
import { basename, join } from 'node:path';
import { databasePath, loadConfig, thumbnailsDir } from './config.ts';
import { openDatabase } from './db/db.ts';
import { DevFacade } from './features/dev/dev.facade.ts';
import { startServer } from './http/server.ts';
import { log } from './shared/log.ts';

const RETIRED_SETTINGS = [
  'importConcurrency → PRANDIUM_IMPORT_CONCURRENCY',
  'userAgent → PRANDIUM_USER_AGENT',
  'pageSize → fixed at 24',
  'addHistoryEntryWhenRating → always on',
].join(', ');

function main(): void {
  try {
    const config = loadConfig();
    mkdirSync(thumbnailsDir(config), { recursive: true });
    if (existsSync(join(config.configDir, 'settings.json'))) {
      log.warn('server', `settings.json is ignored: ${RETIRED_SETTINGS}`);
    }

    const db = openDatabase(databasePath(config), {
      onMigration: (migration) => {
        log.info('db', `applied ${basename(migration.file, '.sql')}`);
      },
      onAdopt: (version) => {
        log.info('db', `adopted schema version ${version} from PRAGMA user_version`);
      },
    });

    const server = startServer(db, config);

    // Installed before the banner: whoever waits for it may send a signal the moment it appears.
    const shutdown = async (signal: NodeJS.Signals): Promise<void> => {
      log.info('server', `stopping (${signal})`);
      await server.stop();
      db.close();
      process.exit(0);
    };
    process.on('SIGINT', () => {
      void shutdown('SIGINT');
    });
    process.on('SIGTERM', () => {
      void shutdown('SIGTERM');
    });

    log.info('server', `prandium is running on ${server.url}`);
    log.info('server', `config dir: ${config.configDir}`);
    log.info('server', config.passwordHash === null ? 'auth: off (PRANDIUM_PASSWORD_HASH is not set)' : 'auth: on');
    if (DevFacade.enabled()) {
      log.info('server', 'hot reload: on');
    }
  } catch (err) {
    log.error('server', 'failed to start', err);
    process.exit(1);
  }

  process.on('uncaughtException', (err) => {
    log.error('server', 'uncaught exception', err);
    process.exit(1);
  });
  process.on('unhandledRejection', (reason) => {
    log.error('server', 'unhandled rejection', reason);
    process.exit(1);
  });
}

if (import.meta.main) {
  main();
}
