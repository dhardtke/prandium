import { path } from "../../deps.ts";

export function getHome(): string | undefined {
  if (Deno.build.os === "windows") {
    return Deno.env.get("USERPROFILE");
  }
  return Deno.env.get("HOME");
}

export const DefaultConfigDir = "~/.config/prandium";

export function defaultConfigDir(): string {
  const home = getHome();
  if (!home) {
    throw new Error("Could not read home directory.");
  }
  return path.resolve(home, ".config", "prandium");
}

const ScriptDir = path.dirname(path.fromFileUrl(import.meta.url));

export function root(...parts: string[]): string {
  return path.resolve(ScriptDir, "..", "..", ...parts);
}

export function roundUpToThreeDigits(n: number): number {
  return Math.round((n + Number.EPSILON) * 1000) / 1000;
}

export function getCpuCores(): number {
  return navigator.hardwareConcurrency;
}
