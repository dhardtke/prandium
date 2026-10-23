import { log } from '../../../shared/log.ts';

const FREE_ATTEMPTS = 5;
const BASE_LOCK_S = 60;
const MAX_LOCK_S = 3600;
const FORGET_MS = 24 * 60 * 60 * 1000;
const MAX_CLIENTS = 10_000;
// Caps what many addresses at once can guess; one address is locked long before it gets near.
const GLOBAL_FAILURES = 100;
const GLOBAL_WINDOW_MS = 60 * 60 * 1000;

export type ThrottleDecision = { kind: 'locked'; retryAfter: number } | { kind: 'go' };

interface Backoff {
  failures: number;
  lockedUntil: number;
  lockS: number;
  seenAt: number;
}

// Per client, so a stranger's guesses cannot lock the owner out; see client-address.ts for the key.
export class LoginThrottle {
  readonly #now: () => number;
  /** In order of last attempt, oldest first. */
  readonly #clients = new Map<string, Backoff>();
  #windowStart = 0;
  #windowFailures = 0;
  #windowLogged = false;

  constructor(now: () => number) {
    this.#now = now;
  }

  /** Counts the attempt as a failure up front so concurrent guesses cannot all pass; `succeeded()` undoes it. */
  begin(client: string): ThrottleDecision {
    const now = this.#now();
    this.#forget(now);
    this.#rollWindow(now);
    const backoff = this.#clients.get(client) ?? { failures: 0, lockedUntil: 0, lockS: 0, seenAt: now };
    const globalUntil = this.#windowFailures >= GLOBAL_FAILURES ? this.#windowStart + GLOBAL_WINDOW_MS : 0;
    const lockedUntil = Math.max(backoff.lockedUntil, globalUntil);
    if (now < lockedUntil) {
      return { kind: 'locked', retryAfter: Math.ceil((lockedUntil - now) / 1000) };
    }
    backoff.failures++;
    backoff.seenAt = now;
    if (backoff.failures >= FREE_ATTEMPTS) {
      backoff.lockS = Math.min(BASE_LOCK_S * 2 ** (backoff.failures - FREE_ATTEMPTS), MAX_LOCK_S);
      backoff.lockedUntil = now + backoff.lockS * 1000;
    }
    this.#clients.delete(client);
    this.#clients.set(client, backoff);
    if (this.#clients.size > MAX_CLIENTS) {
      this.#clients.delete(this.#clients.keys().next().value ?? '');
    }
    this.#windowFailures++;
    return { kind: 'go' };
  }

  /** Logs here, not in `begin()`, so a correct password never reports a lockout. */
  failed(client: string): void {
    const backoff = this.#clients.get(client);
    if (backoff !== undefined && backoff.failures >= FREE_ATTEMPTS) {
      log.warn('auth', `login locked for ${backoff.lockS} s after ${backoff.failures} failed attempts from ${client}`);
    }
    if (this.#windowFailures >= GLOBAL_FAILURES && !this.#windowLogged) {
      this.#windowLogged = true;
      log.warn('auth', `login locked for everyone after ${this.#windowFailures} failed attempts within an hour`);
    }
  }

  succeeded(client: string): void {
    this.#clients.delete(client);
    this.#windowFailures = Math.max(this.#windowFailures - 1, 0);
  }

  #forget(now: number): void {
    for (const [client, backoff] of this.#clients) {
      if (now - backoff.seenAt < FORGET_MS) {
        return;
      }
      this.#clients.delete(client);
    }
  }

  #rollWindow(now: number): void {
    if (now - this.#windowStart >= GLOBAL_WINDOW_MS) {
      this.#windowStart = now;
      this.#windowFailures = 0;
      this.#windowLogged = false;
    }
  }
}
