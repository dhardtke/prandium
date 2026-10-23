import type { LoginRequestDto } from '../../../shared/dto/auth.ts';
import { badRequest, unauthorized } from '../../http/errors.ts';
import { type RouteHandler, type RouteTable, wrapHandlers } from '../../http/routing.ts';
import { log } from '../../shared/log.ts';
import { LoginThrottle } from './internal/login-throttle.ts';
import { check, COOKIE_NAME, expired, issue } from './internal/session-cookie.ts';

const MAX_PASSWORD_LENGTH = 1000;
const PASSWORD_HASH = /^\$(argon2(id|i|d)|2[aby])\$/;

export interface AuthOptions {
  /** null turns authentication off. */
  passwordHash: string | null;
  now?: () => number;
}

export type LoginResult = { kind: 'ok'; cookie: string | null } | { kind: 'locked'; retryAfter: number };

export function isPasswordHash(value: string): boolean {
  return PASSWORD_HASH.test(value);
}

export class AuthFacade {
  readonly #hash: string | null;
  readonly #now: () => number;
  readonly #throttle: LoginThrottle;

  constructor(options: AuthOptions) {
    this.#hash = options.passwordHash;
    this.#now = options.now ?? Date.now;
    this.#throttle = new LoginThrottle(this.#now);
  }

  enabled(): boolean {
    return this.#hash !== null;
  }

  async login(dto: LoginRequestDto, client: string): Promise<LoginResult> {
    const password: unknown = dto.password;
    if (typeof password !== 'string' || password === '' || password.length > MAX_PASSWORD_LENGTH) {
      throw badRequest(`"password" is required and must be a non-empty string of at most ${MAX_PASSWORD_LENGTH} characters`);
    }
    if (this.#hash === null) {
      return { kind: 'ok', cookie: null };
    }
    // Reserve the attempt before the await, so concurrent guesses are counted and locks cost no hashing.
    const decision = this.#throttle.begin(client);
    if (decision.kind === 'locked') {
      return decision;
    }
    if (!(await Bun.password.verify(password, this.#hash))) {
      // Before failed(), so a lockout's line follows the attempt that started it.
      log.warn('auth', 'wrong password');
      this.#throttle.failed(client);
      throw unauthorized('Wrong password');
    }
    this.#throttle.succeeded(client);
    log.info('auth', 'login');
    return { kind: 'ok', cookie: issue(this.#hash, this.#now()) };
  }

  logoutCookie(): string {
    return expired();
  }

  guard(table: RouteTable): RouteTable {
    const hash = this.#hash;
    if (hash === null) {
      return table;
    }
    const wrap =
      (handler: RouteHandler): RouteHandler =>
      async (req, server) => {
        const state = check(hash, req.cookies.get(COOKIE_NAME), this.#now());
        if (state === 'invalid') {
          throw unauthorized();
        }
        const res = await handler(req, server);
        if (state === 'renew' && res instanceof Response) {
          res.headers.append('Set-Cookie', issue(hash, this.#now()));
        }
        return res;
      };
    return wrapHandlers(table, 'auth guard', wrap);
  }
}

export function createAuthFacade(options: AuthOptions): AuthFacade {
  return new AuthFacade(options);
}
