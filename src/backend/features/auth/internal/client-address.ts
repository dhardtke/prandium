const LOOPBACK = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1']);

// The proxy appends the address it saw, so the last entry is the one a client cannot forge.
export function clientAddress(remote: string | undefined, forwardedFor: string | null): string {
  const trusted = remote !== undefined && LOOPBACK.has(remote) && forwardedFor !== null;
  const address = trusted ? (forwardedFor.split(',').at(-1)?.trim() ?? '') : (remote ?? '');
  return throttleKey(address);
}

// One IPv6 subscriber holds at least a /64, so a key per address would let them rotate past the throttle.
function throttleKey(address: string): string {
  const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/i.exec(address)?.[1];
  if (mapped !== undefined) {
    return mapped;
  }
  if (!address.includes(':') || LOOPBACK.has(address)) {
    return address;
  }
  const [head = '', tail = ''] = address.split('%', 1)[0]?.split('::', 2) ?? [];
  const left = head === '' ? [] : head.split(':');
  const right = tail === '' ? [] : tail.split(':');
  const groups = [...left, ...Array<string>(Math.max(8 - left.length - right.length, 0)).fill('0'), ...right];
  return `${groups
    .slice(0, 4)
    .map((group) => Number.parseInt(group, 16).toString(16))
    .join(':')}::/64`;
}
