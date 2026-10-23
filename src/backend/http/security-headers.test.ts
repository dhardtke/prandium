import { describe, expect, test } from 'bun:test';
import { useServer } from '../testing.ts';

const { api } = useServer();

function expectBaseHeaders(res: Response): void {
  expect(res.headers.get('x-content-type-options')).toBe('nosniff');
  expect(res.headers.get('referrer-policy')).toBe('same-origin');
  expect(res.headers.get('x-frame-options')).toBe('DENY');
}

describe('security headers', () => {
  test('lock an API response down completely', async () => {
    const res = await api('/api/health');
    expectBaseHeaders(res);
    expect(res.headers.get('content-security-policy')).toBe("default-src 'none'; frame-ancestors 'none'");
  });

  test('reach an error answered from a throw', async () => {
    const res = await api('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    expect(res.status).toBe(400);
    expectBaseHeaders(res);
  });

  test('reach a static file', async () => {
    expectBaseHeaders(await api('/manifest.webmanifest'));
  });

  test("keep a page's policy on a revalidation, whose headers replace the cached ones", async () => {
    // Tests running in parallel write scratch modules into src/frontend/, which changes the page's tag between two requests.
    let page = await api('/');
    let revalidated = await api('/', { headers: { 'If-None-Match': page.headers.get('etag') ?? '' } });
    for (let attempt = 0; attempt < 5 && revalidated.status !== 304; attempt++) {
      await Bun.sleep(50);
      page = await api('/');
      revalidated = await api('/', { headers: { 'If-None-Match': page.headers.get('etag') ?? '' } });
    }
    expect(revalidated.status).toBe(304);
    expect(revalidated.headers.get('content-security-policy')).toBe(page.headers.get('content-security-policy'));
  });

  test("give a page a policy that allows its own inline scripts and nothing else's", async () => {
    const res = await api('/');
    expectBaseHeaders(res);
    const policy = res.headers.get('content-security-policy') ?? '';
    expect(policy).toContain("frame-ancestors 'none'");
    expect(policy).toContain("object-src 'none'");
    const html = await res.text();
    const scripts = [...html.matchAll(/<script(?![^>]*\bsrc=)(?![^>]*application\/json)[^>]*>([\s\S]*?)<\/script>/g)].map((match) => match[1] ?? '');
    expect(scripts.length).toBeGreaterThan(0);
    const scriptSrc = policy.split('; ').find((directive) => directive.startsWith('script-src ')) ?? '';
    expect(scriptSrc.split(' ').slice(1)).toEqual([
      "'self'",
      ...scripts.map((script) => `'sha256-${new Bun.CryptoHasher('sha256').update(script.replaceAll('\r\n', '\n')).digest('base64')}'`),
    ]);
  });
});
