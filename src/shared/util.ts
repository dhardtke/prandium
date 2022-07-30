// noinspection JSUnusedGlobalSymbols

import { path } from "../../deps.ts";

declare global {
    interface Window {
        BUILD_INFO: string;
    }
}

/**
 * The build info that contains meta-information about when the server has been compiled. This value is set during compile-time (see dev/write-build-info.ts).
 */
export const BUILD_INFO = window["BUILD_INFO"];

/**
 * Whether the application is running from a single JavaScript file that has been built before.
 */
export const IS_COMPILED = typeof BUILD_INFO !== "undefined";

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
    if (Deno.mainModule.endsWith(".test.ts")) {
        while (RootDir && path.basename(RootDir) !== "tests") {
            RootDir = path.resolve(RootDir, "..");
        }
        RootDir = path.resolve(RootDir, "..");
    } else {
        RootDir = path.resolve(RootDir, "..");
    }
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
