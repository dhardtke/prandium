// Stateless: the key is the password hash, so changing the password invalidates every cookie.
export const COOKIE_NAME = 'prandium_session';
export const SESSION_MS = 90 * 24 * 60 * 60 * 1000;
export const RENEW_AFTER_MS = 24 * 60 * 60 * 1000;

const VALUE = /^(\d{1,16})\.([\w-]+)$/;

export type CookieCheck = 'valid' | 'renew' | 'invalid';

function sign(key: string, expiresAt: number): string {
  return new Bun.CryptoHasher('sha256', key).update(`${COOKIE_NAME}.${expiresAt}`).digest('base64url');
}

function serialize(value: string, maxAgeS: number): string {
  return new Bun.Cookie(COOKIE_NAME, value, {
    path: '/',
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: maxAgeS,
  }).serialize();
}

export function issue(key: string, now: number): string {
  const expiresAt = now + SESSION_MS;
  return serialize(`${expiresAt}.${sign(key, expiresAt)}`, SESSION_MS / 1000);
}

export function expired(): string {
  return serialize('', 0);
}

export function check(key: string, value: string | null, now: number): CookieCheck {
  const match = VALUE.exec(value ?? '');
  if (match === null) {
    return 'invalid';
  }
  const [, rawExpiresAt = '', signature = ''] = match;
  const expiresAt = Number(rawExpiresAt);
  const given = Buffer.from(signature);
  const expected = Buffer.from(sign(key, expiresAt));
  if (given.length !== expected.length || !crypto.timingSafeEqual(given, expected) || expiresAt <= now) {
    return 'invalid';
  }
  return now - (expiresAt - SESSION_MS) > RENEW_AFTER_MS ? 'renew' : 'valid';
}
