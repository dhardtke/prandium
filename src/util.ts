import { path } from "../deps.ts";

export function classNames(
  objects: { constructor: { name: string } }[],
): string {
  return objects.length
    ? objects.map((o) => o.constructor.name).join(", ")
    : "[]";
}

export function getHome(): string | undefined {
  if (Deno.build.os === "windows") {
    return Deno.env.get("USERPROFILE");
  }
  return Deno.env.get("HOME");
}

export const DEFAULT_CONFIG_DIR = "~/.config/cook-guide";

export function defaultConfigDir(): string {
  const home = getHome();
  if (!home) {
    throw new Error("Could not read home directory.");
  }
  return path.resolve(home, ".config", "cook-guide");
}

// deno-lint-ignore no-explicit-any
export function get<T = string>(key: string, obj: any): T {
  return key.split(".").reduce((o, i) => o[i], obj);
}

const SCRIPT_DIR = path.dirname(path.fromFileUrl(import.meta.url));

export function root(...parts: string[]): string {
  return path.resolve(SCRIPT_DIR, "..", ...parts);
}

export function roundUpToThreeDigits(n: number): number {
  return Math.round((n + Number.EPSILON) * 1000) / 1000;
}

export function getCpuCores(): number | undefined {
  // @ts-ignore IntelliJ hiccup
  return Deno.systemCpuInfo().cores;
}
