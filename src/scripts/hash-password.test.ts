import { describe, expect, test } from 'bun:test';
import { join } from 'node:path';

const SCRIPT = join(import.meta.dir, 'hash-password.ts');

async function run(input: string): Promise<{ code: number; stdout: string }> {
  const proc = Bun.spawn([process.execPath, SCRIPT], { stdin: new TextEncoder().encode(input), stdout: 'pipe', stderr: 'pipe' });
  const [code, stdout] = await Promise.all([proc.exited, new Response(proc.stdout).text()]);
  return { code, stdout };
}

describe('hash-password', () => {
  test('hashes the first line of piped stdin', async () => {
    const { code, stdout } = await run('s3cret\n');
    expect(code).toBe(0);
    expect(stdout.trim()).toStartWith('$argon2id$');
    expect(await Bun.password.verify('s3cret', stdout.trim())).toBe(true);
  });

  test('refuses an empty password', async () => {
    expect((await run('\n')).code).toBe(1);
  });
});
