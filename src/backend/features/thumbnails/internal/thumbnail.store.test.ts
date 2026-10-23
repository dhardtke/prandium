import { describe, expect, test } from 'bun:test';
import { existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { useTempDir } from '../../../testing.ts';
import { getUniqueFilename, ThumbnailStore } from './thumbnail.store.ts';

const dir = useTempDir();

const image =
  (body: string, type = 'image/jpeg') =>
  (): Promise<Response> =>
    Promise.resolve(new Response(body, { headers: { 'Content-Type': type } }));

describe('getUniqueFilename', () => {
  test('keeps a free name and numbers a taken one before its extension', () => {
    expect(getUniqueFilename(dir(), 'a.jpg')).toBe('a.jpg');
    writeFileSync(join(dir(), 'a.jpg'), '');
    writeFileSync(join(dir(), 'a-1.jpg'), '');
    expect(getUniqueFilename(dir(), 'a.jpg')).toBe('a-2.jpg');
  });

  test.each([
    ['../../etc/passwd', '-..-etc-passwd'],
    ['a\\b.jpg', 'a-b.jpg'],
    ['.hidden', 'hidden'],
    ['', 'thumbnail'],
  ])('makes %p safe as %p', (wanted, safe) => {
    expect(getUniqueFilename(dir(), wanted)).toBe(safe);
  });
});

describe('ThumbnailStore', () => {
  test('downloads under the UTF-8 name of the URL', async () => {
    const store = new ThumbnailStore(dir());
    const file = await store.download('https://example.org/Gem%C3%BCsereis.jpg', 'UA', image('jpeg'));
    expect(file).toBe('Gemüsereis.jpg');
    expect(await Bun.file(join(dir(), file)).text()).toBe('jpeg');
  });

  test('names a download without an extension by its content type', async () => {
    expect(await new ThumbnailStore(dir()).download('https://example.org/image', 'UA', image('png', 'image/png'))).toBe('image.png');
  });

  test('refuses an image that answers an error', async () => {
    const missing = (): Promise<Response> => Promise.resolve(new Response('', { status: 404 }));
    const error = await new ThumbnailStore(dir()).download('https://example.org/a.jpg', 'UA', missing).catch((cause: unknown) => cause);
    expect(error).toEqual(new Error('The image answered 404'));
  });

  test('writes, resolves and removes a file', async () => {
    const store = new ThumbnailStore(dir());
    const file = await store.write(new Uint8Array([1]), 'upload', 'image/webp');
    expect(file).toBe('upload.webp');
    expect(store.resolve(file)).toBe(join(dir(), 'upload.webp'));
    await store.remove(file);
    expect(existsSync(join(dir(), file))).toBe(false);
  });

  test.each(['../secret', '..', '', 'a\0b'])('resolves nothing outside the directory for %p', (file) => {
    expect(new ThumbnailStore(dir()).resolve(file)).toBeNull();
  });
});
