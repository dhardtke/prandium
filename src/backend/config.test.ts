import { describe, expect, test } from 'bun:test';
import { join, resolve } from 'node:path';
import { type Config, type ConfigErrors, DEFAULT_USER_AGENT, isConfig, readConfig } from './config.ts';

const MACHINE = { cpuCores: 4, home: resolve('/home/cook') };
const HASH = '$2b$04$abcdefghijklmnopqrstuuJ8k0b5Q2KQ1x3oIuHqgYV8a2DvYd0XG';

function config(env: Record<string, string | undefined>): Config {
  const result = readConfig(env, MACHINE);
  if (!isConfig(result)) {
    throw new Error(result.errors.join('; '));
  }
  return result;
}

function errors(env: Record<string, string | undefined>): string[] {
  const result: Config | ConfigErrors = readConfig(env, MACHINE);
  return isConfig(result) ? [] : result.errors;
}

describe('readConfig', () => {
  test('has a default for every variable', () => {
    expect(config({})).toEqual({
      host: '127.0.0.1',
      port: 8000,
      databasePath: resolve('data', 'prandium.db'),
      thumbnailsDir: resolve('data', 'thumbnails'),
      passwordHash: null,
      dev: false,
      importConcurrency: 4,
      userAgent: DEFAULT_USER_AGENT,
    });
  });

  test('reads every variable', () => {
    expect(
      config({
        HOST: '0.0.0.0',
        PORT: '3000',
        PRANDIUM_DB: resolve('/srv/prandium/prandium.db'),
        PRANDIUM_THUMBNAIL_DIR: resolve('/srv/prandium/thumbnails'),
        PRANDIUM_PASSWORD_HASH: HASH,
        PRANDIUM_DEV: '1',
        PRANDIUM_IMPORT_CONCURRENCY: '2',
        PRANDIUM_USER_AGENT: 'curl/8',
      }),
    ).toEqual({
      host: '0.0.0.0',
      port: 3000,
      databasePath: resolve('/srv/prandium/prandium.db'),
      thumbnailsDir: resolve('/srv/prandium/thumbnails'),
      passwordHash: HASH,
      dev: true,
      importConcurrency: 2,
      userAgent: 'curl/8',
    });
  });

  test('treats an empty value as unset', () => {
    expect(config({ PORT: '', PRANDIUM_PASSWORD_HASH: ' ', PRANDIUM_USER_AGENT: '' })).toMatchObject({
      port: 8000,
      passwordHash: null,
      userAgent: DEFAULT_USER_AGENT,
    });
  });

  test('turns hot reload on only for 1', () => {
    expect(config({ PRANDIUM_DEV: 'true' }).dev).toBe(false);
  });

  test('accepts port 0, which picks a free port', () => {
    expect(config({ PORT: '0' }).port).toBe(0);
  });

  test.each(['-1', '65536', '80.5', 'eighty', '1e3'])('refuses PORT=%p', (port) => {
    expect(errors({ PORT: port })).toEqual([`PORT must be an integer from 0 to 65535, got "${port}"`]);
  });

  test.each(['0', '5', 'two'])('refuses PRANDIUM_IMPORT_CONCURRENCY=%p outside the CPU cores', (value) => {
    expect(errors({ PRANDIUM_IMPORT_CONCURRENCY: value })).toEqual([`PRANDIUM_IMPORT_CONCURRENCY must be an integer from 1 to 4, got "${value}"`]);
  });

  test('refuses a password hash that is no argon2 or bcrypt hash', () => {
    expect(errors({ PRANDIUM_PASSWORD_HASH: 'hunter2' })).toEqual([
      'PRANDIUM_PASSWORD_HASH is not an argon2 or bcrypt hash; create one with `bun run hash-password`',
    ]);
  });

  test('reports every error at once', () => {
    expect(errors({ PORT: 'x', PRANDIUM_IMPORT_CONCURRENCY: 'y', PRANDIUM_PASSWORD_HASH: 'z' })).toHaveLength(3);
  });

  test.each([
    ['~', MACHINE.home],
    ['~/recipes', join(MACHINE.home, 'recipes')],
    ['~\\recipes', join(MACHINE.home, 'recipes')],
  ])('expands %p in PRANDIUM_DB and PRANDIUM_THUMBNAIL_DIR', (path, expanded) => {
    expect(config({ PRANDIUM_DB: path, PRANDIUM_THUMBNAIL_DIR: path })).toMatchObject({ databasePath: expanded, thumbnailsDir: expanded });
  });

  test('resolves a relative PRANDIUM_DB and PRANDIUM_THUMBNAIL_DIR against the working directory', () => {
    expect(config({ PRANDIUM_DB: 'recipes.db', PRANDIUM_THUMBNAIL_DIR: 'images' })).toMatchObject({
      databasePath: resolve('recipes.db'),
      thumbnailsDir: resolve('images'),
    });
  });
});
