import {path} from "./deps.ts";

export function toInt(s: string, _default: number = 0): number {
    return parseInt(s, 10) || _default;
}

export function classNames(objects: object[]): string {
    return objects.length ? objects.map(o => o.constructor.name).join(", ") : "[]";
}

export function getHome(): string | undefined {
    if (Deno.build.os === "windows") {
        return Deno.env.get("USERPROFILE");
    }
    return Deno.env.get("HOME");
}

const SCRIPT_DIR = path.dirname(path.fromFileUrl(import.meta.url));

export function root(...parts: string[]): string {
    return path.resolve(SCRIPT_DIR, "..", ...parts);
}
