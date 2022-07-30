import { path } from "../../../deps.ts";

export function buildDbPath(configDir: string): string {
    return path.resolve(configDir, "data.db");
}
