import { path } from "../../deps.ts";

const RootDir = path.resolve(path.dirname(path.fromFileUrl(import.meta.url)), "..", "..");

export function testRoot(...parts: string[]): string {
  return path.resolve(RootDir, ...parts);
}
