export function withTemp(
  test: (tmpDir: string) => Promise<void>,
): () => Promise<void> {
  return async () => {
    const tmpDir = await Deno.makeTempDir();
    try {
      await test(tmpDir);
    } finally {
      await Deno.remove(tmpDir, { recursive: true });
    }
  };
}
