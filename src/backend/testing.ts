import { afterEach, beforeEach } from 'bun:test';
import type { Server } from 'bun';
import type { Database } from 'bun:sqlite';
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { type Config, DEFAULT_USER_AGENT } from './config.ts';
import { openDatabase } from './db/db.ts';
import type { AuthOptions } from './features/auth/auth.facade.ts';
import { HttpError } from './http/errors.ts';
import { startServer } from './http/server.ts';
import { type LogLevel, entryText, setLogSink } from './shared/log.ts';

export interface TestServer {
  api: (path: string, init?: RequestInit) => Promise<Response>;
  post: (path: string, body: unknown) => Promise<Response>;
  patch: (path: string, body: unknown) => Promise<Response>;
  put: (path: string, body: unknown) => Promise<Response>;
  del: (path: string) => Promise<Response>;
  logs: () => LogLine[];
  /** The server's thumbnail directory, empty at the start of each test. */
  thumbnailsDir: () => string;
  /** For rows the API cannot write, such as an old app's. */
  db: () => Database;
}

export interface LogLine {
  level: LogLevel;
  text: string;
}

export function useLogs(): () => LogLine[] {
  let lines: LogLine[] = [];
  let restore = (): void => {};

  beforeEach(() => {
    lines = [];
    restore = setLogSink((entry) => {
      lines.push({ level: entry.level, text: entryText(entry) });
    });
  });

  afterEach(() => {
    restore();
  });

  return () => lines;
}

// Hooks are registered here, not at module top level, so each test file gets its own database.
export function useServer(options: { auth?: AuthOptions } = {}): TestServer {
  let db: Database;
  let server: Server<undefined>;
  let base = '';
  const dir = useTempDir();
  let config: Config;

  beforeEach(() => {
    db = openDatabase(':memory:');
    config = testConfig(dir(), { passwordHash: options.auth?.passwordHash ?? null });
    mkdirSync(config.thumbnailsDir);
    server = startServer(db, config, options.auth?.now);
    base = server.url.origin;
  });

  afterEach(async () => {
    await server.stop(true);
    db.close();
  });

  // After the hooks above: afterEach runs in registration order, so the server stops while captured.
  const logs = useLogs();

  function api(path: string, init?: RequestInit): Promise<Response> {
    return fetch(`${base}${path}`, init);
  }

  function send(method: string, path: string, body: unknown): Promise<Response> {
    return api(path, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  const post = (path: string, body: unknown): Promise<Response> => send('POST', path, body);
  const patch = (path: string, body: unknown): Promise<Response> => send('PATCH', path, body);
  const put = (path: string, body: unknown): Promise<Response> => send('PUT', path, body);
  const del = (path: string): Promise<Response> => api(path, { method: 'DELETE' });

  return { api, post, patch, put, del, logs, thumbnailsDir: () => config.thumbnailsDir, db: () => db };
}

/** Names `cena.sqlite` and `thumbnails/` inside `dir` without creating either. */
export function testConfig(dir: string, overrides: Partial<Config> = {}): Config {
  return {
    host: '127.0.0.1',
    port: 0,
    databasePath: join(dir, 'cena.sqlite'),
    thumbnailsDir: join(dir, 'thumbnails'),
    passwordHash: null,
    dev: false,
    importConcurrency: 2,
    userAgent: DEFAULT_USER_AGENT,
    ...overrides,
  };
}

export function useTempDir(): () => string {
  let dir = '';

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'cena-'));
  });

  afterEach(() => {
    // Windows releases the handle a moment after close(), so retry rather than fail on EBUSY.
    rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 20 });
  });

  return () => dir;
}

// Bun types `json()` as `Promise<any>` with no generic overload, so the shape is asserted once here.
export async function body<T>(res: Response): Promise<T> {
  const parsed: unknown = await res.json();
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- see above
  return parsed as T;
}

export function at<T>(items: T[], index: number): T {
  const item = items[index];
  if (item === undefined) {
    throw new Error(`expected an element at index ${index}, but the array holds ${items.length}`);
  }
  return item;
}

export function tables(database: Database): string[] {
  return database
    .query<{ name: string }, []>("SELECT name FROM sqlite_master WHERE type = 'table'")
    .all()
    .map((row) => row.name);
}

export function thrown(fn: () => unknown): HttpError {
  try {
    fn();
  } catch (err) {
    if (err instanceof HttpError) {
      return err;
    }
    throw err;
  }
  throw new Error('Expected an HttpError');
}

export function opens(socket: WebSocket): Promise<boolean> {
  return new Promise((done) => {
    socket.addEventListener('open', () => {
      done(true);
    });
    socket.addEventListener('error', () => {
      done(false);
    });
    socket.addEventListener('close', () => {
      done(false);
    });
  });
}

export async function waitForUrl(stream: ReadableStream<Uint8Array>, stderr: () => Promise<string>): Promise<{ url: string; stdout: string }> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let stdout = '';
  const read = async (): Promise<string> => {
    for (;;) {
      const url = /cena is running on (\S+)/.exec(stdout)?.[1];
      if (url !== undefined) {
        return url;
      }
      const chunk = await reader.read();
      if (chunk.done) {
        throw new Error(`the server exited before it started: ${await stderr()}`);
      }
      stdout += decoder.decode(chunk.value, { stream: true });
    }
  };
  const timeout = Bun.sleep(15_000).then(async () => {
    throw new Error(`the server did not start within 15 s: ${await stderr()}`);
  });
  const url = await Promise.race([read(), timeout]);
  reader.releaseLock();
  return { url, stdout };
}
