import { path } from "./deps.ts";

export function toInt(s: string, _default = 0): number {
  return parseInt(s, 10) || _default;
}

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

// deno-lint-ignore no-explicit-any
export function get(key: string, obj: any): string {
  return key.split(".").reduce((o, i) => o[i], obj);
}

const SCRIPT_DIR = path.dirname(path.fromFileUrl(import.meta.url));

export function root(...parts: string[]): string {
  return path.resolve(SCRIPT_DIR, "..", ...parts);
}
