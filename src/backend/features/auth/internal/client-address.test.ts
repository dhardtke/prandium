import { describe, expect, test } from 'bun:test';
import { clientAddress } from './client-address.ts';

describe('clientAddress', () => {
  test('trusts the last X-Forwarded-For entry from the local proxy', () => {
    expect(clientAddress('127.0.0.1', '10.0.0.1, 203.0.113.7')).toBe('203.0.113.7');
    expect(clientAddress('::1', '203.0.113.7')).toBe('203.0.113.7');
    expect(clientAddress('::ffff:127.0.0.1', '203.0.113.7')).toBe('203.0.113.7');
  });

  test('ignores X-Forwarded-For from anyone else', () => {
    expect(clientAddress('198.51.100.2', '203.0.113.7')).toBe('198.51.100.2');
  });

  test('falls back to the connection without X-Forwarded-For', () => {
    expect(clientAddress('127.0.0.1', null)).toBe('127.0.0.1');
    expect(clientAddress('::1', null)).toBe('::1');
    expect(clientAddress(undefined, null)).toBe('');
  });

  test('unwraps an IPv4-mapped address', () => {
    expect(clientAddress('::ffff:198.51.100.2', null)).toBe('198.51.100.2');
  });

  test('keys IPv6 by its /64', () => {
    expect(clientAddress('2001:db8:aa:bb:1:2:3:4', null)).toBe('2001:db8:aa:bb::/64');
    expect(clientAddress('2001:db8:aa:bb::9', null)).toBe('2001:db8:aa:bb::/64');
    expect(clientAddress('2001:0db8::1', null)).toBe('2001:db8:0:0::/64');
    expect(clientAddress('fe80::1%eth0', null)).toBe('fe80:0:0:0::/64');
  });
});
