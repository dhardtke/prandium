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
      databasePath: resolve('data', 'cena.db'),
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
        CENA_DB: resolve('/srv/cena/cena.db'),
        CENA_THUMBNAIL_DIR: resolve('/srv/cena/thumbnails'),
        CENA_PASSWORD_HASH: HASH,
        CENA_DEV: '1',
        CENA_IMPORT_CONCURRENCY: '2',
        CENA_USER_AGENT: 'curl/8',
      }),
    ).toEqual({
      host: '0.0.0.0',
      port: 3000,
      databasePath: resolve('/srv/cena/cena.db'),
      thumbnailsDir: resolve('/srv/cena/thumbnails'),
      passwordHash: HASH,
      dev: true,
      importConcurrency: 2,
      userAgent: 'curl/8',
    });
  });

  test('treats an empty value as unset', () => {
    expect(config({ PORT: '', CENA_PASSWORD_HASH: ' ', CENA_USER_AGENT: '' })).toMatchObject({
      port: 8000,
      passwordHash: null,
      userAgent: DEFAULT_USER_AGENT,
    });
  });

  test('turns hot reload on only for 1', () => {
    expect(config({ CENA_DEV: 'true' }).dev).toBe(false);
  });

  test('accepts port 0, which picks a free port', () => {
    expect(config({ PORT: '0' }).port).toBe(0);
  });

  test.each(['-1', '65536', '80.5', 'eighty', '1e3'])('refuses PORT=%p', (port) => {
    expect(errors({ PORT: port })).toEqual([`PORT must be an integer from 0 to 65535, got "${port}"`]);
  });

  test.each(['0', '5', 'two'])('refuses CENA_IMPORT_CONCURRENCY=%p outside the CPU cores', (value) => {
    expect(errors({ CENA_IMPORT_CONCURRENCY: value })).toEqual([`CENA_IMPORT_CONCURRENCY must be an integer from 1 to 4, got "${value}"`]);
  });

  test('refuses a password hash that is no argon2 or bcrypt hash', () => {
    expect(errors({ CENA_PASSWORD_HASH: 'hunter2' })).toEqual(['CENA_PASSWORD_HASH is not an argon2 or bcrypt hash; create one with `bun run hash-password`']);
  });

  test('reports every error at once', () => {
    expect(errors({ PORT: 'x', CENA_IMPORT_CONCURRENCY: 'y', CENA_PASSWORD_HASH: 'z' })).toHaveLength(3);
  });

  test.each([
    ['~', MACHINE.home],
    ['~/recipes', join(MACHINE.home, 'recipes')],
    ['~\\recipes', join(MACHINE.home, 'recipes')],
  ])('expands %p in CENA_DB and CENA_THUMBNAIL_DIR', (path, expanded) => {
    expect(config({ CENA_DB: path, CENA_THUMBNAIL_DIR: path })).toMatchObject({ databasePath: expanded, thumbnailsDir: expanded });
  });

  test('resolves a relative CENA_DB and CENA_THUMBNAIL_DIR against the working directory', () => {
    expect(config({ CENA_DB: 'recipes.db', CENA_THUMBNAIL_DIR: 'images' })).toMatchObject({
      databasePath: resolve('recipes.db'),
      thumbnailsDir: resolve('images'),
    });
  });
});
