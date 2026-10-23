import { describe, expect, test } from "bun:test";
import path from "node:path";
import { DefaultSettings, readFromDisk, Settings, SettingsFilename } from "../../src/data/settings.ts";
import { getCpuCores } from "../../src/shared/util.ts";
import { withTemp } from "../_internal/with-temp.function.ts";

function jsonParseError(json: string): string {
    try {
        JSON.parse(json);
    } catch (e) {
        return String(e);
    }
    throw new Error(`${json} is valid JSON`);
}

describe("Settings", () => {
    test.each<{
        data: string | Partial<Record<keyof Settings, unknown>>;
        message: string;
    }>([
        {
            data: "",
            message: `Error reading ${SettingsFilename}: ${jsonParseError("")}`,
        },
        {
            data: { importConcurrency: "0" },
            message: `Error reading ${SettingsFilename}: Error: importConcurrency must be between 1 and ${getCpuCores()}`,
        },
        {
            data: { importConcurrency: -1 },
            message: `Error reading ${SettingsFilename}: Error: importConcurrency must be between 1 and ${getCpuCores()}`,
        },
        {
            data: { importConcurrency: getCpuCores() + 1 },
            message: `Error reading ${SettingsFilename}: Error: importConcurrency must be between 1 and ${getCpuCores()}`,
        },
        {
            data: { userAgent: 42 },
            message: `Error reading ${SettingsFilename}: Error: userAgent must be of type string`,
        },
        {
            data: { addHistoryEntryWhenRating: "false" },
            message: `Error reading ${SettingsFilename}: Error: addHistoryEntryWhenRating must be of type boolean`,
        },
        {
            data: { lorem: false } as Partial<Record<keyof Settings, unknown>>,
            message: `Error reading ${SettingsFilename}: Error: Unknown property lorem`,
        },
    ])("readFromDisk throws $message", ({ data, message }) =>
        withTemp(async (tmpDir) => {
            await Bun.write(
                path.join(tmpDir, SettingsFilename),
                typeof data === "string" ? data : JSON.stringify(data),
            );
            await expect(readFromDisk(tmpDir)).rejects.toThrow(message);
        })());

    test(
        `readFromDisk returns default settings if settings unavailable`,
        withTemp(async (tmpDir) => {
            expect(await readFromDisk(tmpDir)).toEqual(DefaultSettings);
        }),
    );

    test(
        `readFromDisk merges default with provided settings`,
        withTemp(async (tmpDir) => {
            const data: Partial<Settings> = {
                importConcurrency: 1,
                pageSize: DefaultSettings.pageSize + 1,
            };
            await Bun.write(
                path.join(tmpDir, SettingsFilename),
                JSON.stringify(data),
            );
            const actual = await readFromDisk(tmpDir);
            expect(actual.importConcurrency).toEqual(data.importConcurrency!);
            expect(actual.pageSize).toEqual(data.pageSize!);
            expect(actual.userAgent).toEqual(DefaultSettings.userAgent);
            expect(actual.addHistoryEntryWhenRating).toEqual(DefaultSettings.addHistoryEntryWhenRating);
        }),
    );
});
