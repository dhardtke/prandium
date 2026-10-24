import { describe, expect, test } from 'bun:test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { HealthDto } from '../shared/dto/meta.ts';
import { body, useTempDir, waitForUrl } from './testing.ts';

// Kill in each test's `finally`, not a hook: useTempDir()'s cleanup runs first and fails on Windows.
describe('main', () => {
  const dir = useTempDir();

  function spawn(env: Record<string, string> = {}): Bun.Subprocess<'ignore', 'pipe', 'pipe'> {
    const base: Record<string, string | undefined> = { ...process.env };
    delete base.JOURNAL_STREAM;
    delete base.CENA_PASSWORD_HASH;
    delete base.CENA_DEV;
    delete base.CENA_IMPORT_CONCURRENCY;
    return Bun.spawn([process.execPath, 'src/backend/main.ts'], {
      env: { ...base, PORT: '0', CENA_DB: join(dir(), 'data.db'), CENA_THUMBNAIL_DIR: join(dir(), 'thumbnails'), ...env },
      stdin: 'ignore',
      stdout: 'pipe',
      stderr: 'pipe',
    });
  }

  // Everything the server printed up to the banner's last line, stderr last.
  async function started(env: Record<string, string> = {}, visit: (url: string) => Promise<void> = async () => {}): Promise<string> {
    const proc = spawn(env);
    try {
      let { url, stdout } = await waitForUrl(proc.stdout, () => new Response(proc.stderr).text());
      // A Response refuses a stream that waitForUrl() already read from.
      const reader = proc.stdout.getReader();
      const decoder = new TextDecoder();
      while (!stdout.includes('server auth: ')) {
        const chunk = await reader.read();
        if (chunk.done) {
          break;
        }
        stdout += decoder.decode(chunk.value, { stream: true });
      }
      reader.releaseLock();
      await visit(url);
      proc.kill();
      return stdout + (await new Response(proc.stderr).text());
    } finally {
      proc.kill();
      await proc.exited;
    }
  }

  async function exitsWith(env: Record<string, string>): Promise<{ code: number; stderr: string }> {
    const proc = spawn(env);
    try {
      return { code: await proc.exited, stderr: await new Response(proc.stderr).text() };
    } finally {
      proc.kill();
      await proc.exited;
    }
  }

  test('prints the banner in the terminal format', async () => {
    const stdout = await started();
    expect(stdout).toMatch(/^\d\d:\d\d:\d\d server cena is running on /m);
    expect(stdout).toContain(`server database: ${join(dir(), 'data.db')}`);
    expect(stdout).toContain(`server thumbnails: ${join(dir(), 'thumbnails')}`);
    expect(stdout).toContain('server auth: off (CENA_PASSWORD_HASH is not set)');
    expect(stdout).toContain('db applied 005-remove-tag-description');
  });

  test('answers the health check and the frontend', async () => {
    await started({}, async (url) => {
      expect(await body<HealthDto>(await fetch(new URL('/api/health', url)))).toEqual({ status: 'ok', app: 'cena', auth: false });
      expect(await (await fetch(url)).text()).toContain('<ce-app>');
    });
  });

  test('warns about a leftover settings.json beside the database, naming what replaced each key', async () => {
    writeFileSync(join(dir(), 'settings.json'), '{}');
    expect(await started()).toContain(
      'WARN server settings.json is ignored: importConcurrency → CENA_IMPORT_CONCURRENCY, userAgent → CENA_USER_AGENT, pageSize → fixed at 24, addHistoryEntryWhenRating → always on',
    );
  });

  test.each([
    [{ PORT: 'eighty' }, 'PORT must be an integer from 0 to 65535'],
    [{ CENA_IMPORT_CONCURRENCY: '0' }, 'CENA_IMPORT_CONCURRENCY must be an integer from 1 to'],
  ])('refuses invalid env %p', async (env, message) => {
    const { code, stderr } = await exitsWith(env);
    expect(code).toBe(1);
    expect(stderr).toContain(`ERROR server ${message}`);
  });

  test('keeps the terminal format when JOURNAL_STREAM names another file', async () => {
    const stdout = await started({ JOURNAL_STREAM: '8:1234' });
    expect(stdout).toMatch(/^\d\d:\d\d:\d\d server cena is running on /m);
    expect(stdout).not.toContain('<6>');
  });

  test('refuses a CENA_PASSWORD_HASH that is no hash', async () => {
    const { code, stderr } = await exitsWith({ CENA_PASSWORD_HASH: 'nope' });
    expect(code).toBe(1);
    expect(stderr).toContain('ERROR server CENA_PASSWORD_HASH is not an argon2 or bcrypt hash');
  });

  test('logs a startup failure with its error and exits with 1', async () => {
    mkdirSync(join(dir(), 'data.db'));
    const { code, stderr } = await exitsWith({});
    expect(code).toBe(1);
    expect(stderr).toMatch(/ERROR server failed to start\n[\s\S]*SQLiteError/);
  });

  // Windows cannot deliver SIGTERM to a handler.
  test.skipIf(process.platform === 'win32')('logs the signal it stops on and exits with 0', async () => {
    const proc = spawn();
    try {
      await waitForUrl(proc.stdout, () => new Response(proc.stderr).text());
      proc.kill('SIGTERM');
      expect(await proc.exited).toBe(0);
      // A Response refuses a stream that waitForUrl() already read from.
      let rest = '';
      const decoder = new TextDecoder();
      for await (const chunk of proc.stdout) {
        rest += decoder.decode(chunk, { stream: true });
      }
      expect(rest).toContain('server stopping (SIGTERM)');
    } finally {
      proc.kill();
      await proc.exited;
    }
  });
});
