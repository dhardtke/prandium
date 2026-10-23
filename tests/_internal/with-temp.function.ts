import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

export function withTemp(test: (tmpDir: string) => Promise<void> | void, dontClean?: boolean): () => Promise<void> {
    return async () => {
        const tmpDir = await mkdtemp(path.join(os.tmpdir(), "prandium-"));
        try {
            await test(tmpDir);
        } finally {
            if (!dontClean) {
                await rm(tmpDir, { recursive: true, force: true });
            }
        }
    };
}
