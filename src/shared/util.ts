// noinspection JSUnusedGlobalSymbols

import { path } from "../../deps.ts";

declare global {
  interface Window {
    IS_COMPILED: boolean;
  }
}

/**
 * Whether the application is running from a single JavaScript file that has previously been built.
 * This value is set during compile time (see dev/set-is-compiled.ts).
 */
export const IS_COMPILED = !!window["IS_COMPILED"];

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

let RootDir: string = path.dirname(path.fromFileUrl(Deno.mainModule));
if (!IS_COMPILED) {
  RootDir = path.resolve(RootDir, "..");
}

export function root(...parts: string[]): string {
  return path.resolve(RootDir, ...parts);
}

export function roundUpToThreeDigits(n: number): number {
  return Math.round((n + Number.EPSILON) * 1000) / 1000;
}

export function getCpuCores(): number {
  return navigator.hardwareConcurrency;
}
