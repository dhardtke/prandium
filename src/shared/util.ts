// noinspection JSUnusedGlobalSymbols

import os from "node:os";
import path from "node:path";

declare global {
    // oxlint-disable-next-line no-var
    var BUILD_INFO: string | undefined;
}

/**
 * The build info that contains meta-information about when the server has been compiled. This value is set during compile-time (see dev/build.ts).
 */
export const BUILD_INFO = globalThis.BUILD_INFO;

/**
 * Whether the application is running from a single JavaScript file that has been built before.
 */
export const IS_COMPILED = typeof BUILD_INFO !== "undefined";

export function getHome(): string | undefined {
    return os.homedir() || undefined;
}

export const DefaultConfigDir = "~/.config/prandium";

export function defaultConfigDir(): string {
    const home = getHome();
    if (!home) {
        throw new Error("Could not read home directory.");
    }
    return path.resolve(home, ".config", "prandium");
}

/**
 * The root directory of the application: the directory containing the server bundle when compiled, the repository root otherwise.
 */
const RootDir = IS_COMPILED ? import.meta.dir : path.resolve(import.meta.dir, "..", "..");

export function root(...parts: string[]): string {
    return path.resolve(RootDir, ...parts);
}

export function roundUpToThreeDigits(n: number): number {
    return Math.round((n + Number.EPSILON) * 1000) / 1000;
}

export function getCpuCores(): number {
    return navigator.hardwareConcurrency;
}
