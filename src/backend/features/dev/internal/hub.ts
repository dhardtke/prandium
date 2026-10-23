import type { ServerWebSocket } from 'bun';
import { type FSWatcher, watch } from 'node:fs';
import { relative } from 'node:path';
import { log } from '../../../shared/log.ts';
import { type Change, changeFor } from './changes.ts';

// Module state: devRoutes() and staticRoutes() build separate facades sharing these clients.
const clients = new Set<ServerWebSocket>();
let watcher: FSWatcher | null = null;

// One save fires several fs.watch events (measured on Windows), so each path settles first.
const DEBOUNCE_MS = 25;
const timers = new Map<string, Timer>();

export function attach(ws: ServerWebSocket, webRoot: string): void {
  clients.add(ws);
  if (watcher !== null) {
    return;
  }
  watcher = watch(webRoot, { recursive: true }, (_event, filename) => {
    if (filename !== null) {
      schedule(filename);
    }
  });
  // Never the reason the process stays alive.
  watcher.unref();
  log.info('dev', `hot reload watching ${relative(process.cwd(), webRoot).replaceAll('\\', '/')}/`);
}

export function detach(ws: ServerWebSocket): void {
  clients.delete(ws);
  if (clients.size > 0 || watcher === null) {
    return;
  }
  watcher.close();
  watcher = null;
  for (const timer of timers.values()) {
    clearTimeout(timer);
  }
  timers.clear();
  log.info('dev', 'hot reload idle');
}

function schedule(filename: string): void {
  const change = changeFor(filename);
  if (change === null) {
    return;
  }
  clearTimeout(timers.get(filename));
  timers.set(
    filename,
    setTimeout(() => {
      timers.delete(filename);
      broadcast(change);
    }, DEBOUNCE_MS),
  );
}

function broadcast(change: Change): void {
  const message = JSON.stringify(change);
  for (const client of clients) {
    client.send(message);
  }
}
