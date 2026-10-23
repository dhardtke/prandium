import path from "node:path";

export function buildDbPath(configDir: string): string {
    return path.resolve(configDir, "data.db");
}
