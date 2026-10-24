import { availableParallelism, homedir } from 'node:os';
import { isAbsolute, join, resolve } from 'node:path';
import { isPasswordHash } from './features/auth/auth.facade.ts';
import { log } from './shared/log.ts';

export interface Config {
  host: string;
  port: number;
  /** The SQLite file, created on first run. */
  databasePath: string;
  /** Holds the thumbnail images. */
  thumbnailsDir: string;
  /** null turns authentication off. */
  passwordHash: string | null;
  dev: boolean;
  importConcurrency: number;
  userAgent: string;
}

export interface ConfigErrors {
  errors: string[];
}

export interface Machine {
  cpuCores: number;
  home: string;
}

export const DEFAULT_PORT = 8000;
export const DEFAULT_HOST = '127.0.0.1';
export const DEFAULT_DATABASE_PATH = join('data', 'prandium.db');
export const DEFAULT_THUMBNAILS_DIR = join('data', 'thumbnails');
export const DEFAULT_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:86.0) Gecko/20100101 Firefox/86.0';

export function readConfig(env: Record<string, string | undefined>, machine: Machine): Config | ConfigErrors {
  const errors: string[] = [];
  const value = (key: string): string | undefined => {
    const raw = env[key]?.trim();
    return raw === '' ? undefined : raw;
  };
  const integer = (key: string, fallback: number, min: number, max: number): number => {
    const raw = value(key);
    if (raw === undefined) {
      return fallback;
    }
    const parsed = Number(raw);
    if (!/^\d+$/.test(raw) || parsed < min || parsed > max) {
      errors.push(`${key} must be an integer from ${min} to ${max}, got "${raw}"`);
      return fallback;
    }
    return parsed;
  };

  const port = integer('PORT', DEFAULT_PORT, 0, 65535);
  const cpuCores = Math.max(1, machine.cpuCores);
  const importConcurrency = integer('PRANDIUM_IMPORT_CONCURRENCY', cpuCores, 1, cpuCores);

  const passwordHash = value('PRANDIUM_PASSWORD_HASH') ?? null;
  if (passwordHash !== null && !isPasswordHash(passwordHash)) {
    errors.push('PRANDIUM_PASSWORD_HASH is not an argon2 or bcrypt hash; create one with `bun run hash-password`');
  }

  const config: Config = {
    host: value('HOST') ?? DEFAULT_HOST,
    port,
    databasePath: expandHome(value('PRANDIUM_DB') ?? DEFAULT_DATABASE_PATH, machine.home),
    thumbnailsDir: expandHome(value('PRANDIUM_THUMBNAIL_DIR') ?? DEFAULT_THUMBNAILS_DIR, machine.home),
    passwordHash,
    dev: value('PRANDIUM_DEV') === '1',
    importConcurrency,
    userAgent: value('PRANDIUM_USER_AGENT') ?? DEFAULT_USER_AGENT,
  };
  return errors.length > 0 ? { errors } : config;
}

export function isConfig(result: Config | ConfigErrors): result is Config {
  return !('errors' in result);
}

/** Reads the process environment; logs every error and exits on any. */
export function loadConfig(): Config {
  const config = readConfig(process.env, { cpuCores: availableParallelism(), home: homedir() });
  if (!isConfig(config)) {
    for (const error of config.errors) {
      log.error('server', error);
    }
    process.exit(1);
  }
  return config;
}

function expandHome(path: string, home: string): string {
  if (path === '~') {
    return home;
  }
  if (path.startsWith('~/') || path.startsWith('~\\')) {
    return join(home, path.slice(2));
  }
  return isAbsolute(path) ? path : resolve(path);
}
