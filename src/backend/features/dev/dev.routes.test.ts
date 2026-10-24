import { describe, expect, test } from 'bun:test';
import { unlink } from 'node:fs/promises';
import { resolve } from 'node:path';
import { openDatabase } from '../../db/db.ts';
import { startServer } from '../../http/server.ts';
import { createStaticFacade } from '../static/static.facade.ts';
import { opens, testConfig, useLogs, useTempDir } from '../../testing.ts';
import { devRoutes } from './dev.routes.ts';

const CLIENT = '/dev/hot.ts';

const logs = useLogs();
const dir = useTempDir();

/** `detach()` logs idle a tick after the last close; wait so it cannot escape the sink. */
async function idle(): Promise<void> {
  for (let waited = 0; waited < 1000; waited += 10) {
    if (logs().some((line) => line.text === 'dev hot reload idle')) {
      return;
    }
    await Bun.sleep(10);
  }
  throw new Error('the hot-reload watcher never went idle');
}

/** Not `useServer()`: PRANDIUM_DEV must be set before routes are built and must not leak. */
async function withDev(enabled: boolean, fn: (origin: string) => Promise<void>): Promise<void> {
  const previous = process.env.PRANDIUM_DEV;
  if (enabled) {
    process.env.PRANDIUM_DEV = '1';
  } else {
    delete process.env.PRANDIUM_DEV;
  }
  const db = openDatabase(':memory:');
  const server = startServer(db, testConfig(dir()));
  try {
    await fn(server.url.origin);
  } finally {
    await server.stop(true);
    db.close();
    if (previous === undefined) {
      delete process.env.PRANDIUM_DEV;
    } else {
      process.env.PRANDIUM_DEV = previous;
    }
  }
}

function socketUrl(origin: string): string {
  return `${origin.replace(/^http/, 'ws')}/dev/ws`;
}

function occurrences(text: string, part: string): number {
  return text.split(part).length - 1;
}

describe('hot reload switched off', () => {
  test('registers no route and injects no client', async () => {
    await withDev(false, async (origin) => {
      expect(devRoutes()).toEqual({});
      expect(await (await fetch(`${origin}/`)).text()).not.toContain(CLIENT);
    });
  });

  test('a socket at /dev/ws never connects', async () => {
    await withDev(false, async (origin) => {
      // Without the route the SPA fallback answers 200, so assert the connection, not the status.
      const socket = new WebSocket(socketUrl(origin));
      expect(await opens(socket)).toBe(false);
      socket.close();
    });
  });
});

describe('hot reload switched on', () => {
  test('injects the client exactly once into the index page and every client route', async () => {
    await withDev(true, async (origin) => {
      for (const path of ['/', '/index.html', '/recipes/1']) {
        expect(occurrences(await (await fetch(`${origin}${path}`)).text(), CLIENT)).toBe(1);
      }
    });
  });

  test('pushes a change to a connected client', async () => {
    await withDev(true, async (origin) => {
      const socket = new WebSocket(socketUrl(origin));
      // Under dev/, which the build never reads, so a parallel build cannot hit the file mid-unlink.
      const file = resolve(createStaticFacade().webRoot(), 'dev', '__hot.css');
      try {
        expect(await opens(socket)).toBe(true);
        const message = new Promise<unknown>((done) => {
          socket.addEventListener('message', (event) => {
            done(typeof event.data === 'string' ? JSON.parse(event.data) : event.data);
          });
        });
        await Bun.write(file, 'a { color: red; }\n');
        // A missed watcher event fails the test instead of hanging the suite.
        const timeout = Bun.sleep(2000).then(() => 'timed out');
        expect(await Promise.race([message, timeout])).toEqual({ swap: '/dev/__hot.css' });
      } finally {
        socket.close();
        await unlink(file);
      }
    });
    await idle();
    expect(logs()).toContainEqual({ level: 'info', text: 'dev hot reload watching src/frontend/' });
  });
});
