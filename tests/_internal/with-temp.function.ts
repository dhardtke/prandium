export function withTemp(
    test: (tmpDir: string) => Promise<void> | void,
    dontClean?: boolean,
): () => Promise<void> {
    return async () => {
        const tmpDir = await Deno.makeTempDir();
        try {
            await test(tmpDir);
        } finally {
            if (!dontClean) {
                await Deno.remove(tmpDir, { recursive: true });
            }
        }
    };
}
