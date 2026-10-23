import { afterEach, beforeEach, expect, test } from 'bun:test';
import { settle, useDom } from '../../../testing.ts';
import { ScreenWakeLock } from './wake-lock.ts';

useDom();

let requests: number;
let releases: number;
let visibility: DocumentVisibilityState;

beforeEach(() => {
  requests = 0;
  releases = 0;
  visibility = 'visible';
  Object.defineProperty(navigator, 'wakeLock', {
    configurable: true,
    value: {
      request: (): Promise<{ release: () => Promise<void> }> => {
        requests++;
        return Promise.resolve({
          release: (): Promise<void> => {
            releases++;
            return Promise.resolve();
          },
        });
      },
    },
  });
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => visibility });
});

afterEach(() => {
  Reflect.deleteProperty(navigator, 'wakeLock');
  Reflect.deleteProperty(document, 'visibilityState');
});

test('requests the lock once and releases it', async () => {
  const lock = new ScreenWakeLock();
  lock.acquire();
  lock.acquire();
  await settle();
  expect(requests).toBe(1);
  lock.release();
  await settle();
  expect(releases).toBe(1);
});

test('requests it again when the page becomes visible, but not once released', async () => {
  const lock = new ScreenWakeLock();
  lock.acquire();
  await settle();
  visibility = 'hidden';
  document.dispatchEvent(new Event('visibilitychange'));
  visibility = 'visible';
  document.dispatchEvent(new Event('visibilitychange'));
  await settle();
  expect(requests).toBe(2);
  lock.release();
  document.dispatchEvent(new Event('visibilitychange'));
  await settle();
  expect(requests).toBe(2);
});

test('does nothing in a browser without the API', async () => {
  Reflect.deleteProperty(navigator, 'wakeLock');
  const lock = new ScreenWakeLock();
  lock.acquire();
  await settle();
  lock.release();
  expect(requests).toBe(0);
});

test('releases a lock that arrives after release()', async () => {
  const lock = new ScreenWakeLock();
  lock.acquire();
  lock.release();
  await settle();
  expect(releases).toBe(1);
});
