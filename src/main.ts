import { mkdir } from "node:fs/promises";
import path from "node:path";
import { Database } from "./data/db.ts";
import { readFromDisk, Settings } from "./data/settings.ts";
import { buildDbPath } from "./data/util/build-db-path.ts";
import { CONFIG_DIR, container, SETTINGS } from "./di.ts";
import { spawnServer } from "./http/webserver.ts";
import { BaseHandler, consoleLogHandlerFactory, log, setupLogger } from "./logging.ts";
import { Options, parseOptions } from "./options.ts";
import { type ResultWithErrorCode } from "./shared/types.ts";
import { IS_COMPILED } from "./shared/util.ts";
import { shouldPrettifyTemplates } from "./tpl/util/render.ts";

export const REQUIRED_BUN_VERSION_RANGE = ">=1.4.4";

async function prepareConfigDir(options: Options) {
    await mkdir(options.configDir, { recursive: true });
    await mkdir(path.join(options.configDir, "thumbnails"), { recursive: true });
}

export function bunVersionIsSatisfied(version = Bun.version, range = REQUIRED_BUN_VERSION_RANGE): boolean {
    return Bun.semver.satisfies(version, range);
}

export async function readSettings(configDir: string): Promise<ResultWithErrorCode<Settings>> {
    try {
        return await readFromDisk(configDir);
    } catch (e) {
        log.error(e);
        return 1;
    }
}

export interface BootData {
    args: string[];
    serverFactory: (args: {
        host: string;
        port: number;
        debug?: boolean;
        secure?: boolean;
        key?: string;
        cert?: string;
        configDir: string;
        db: Database;
        settings: Settings;
    }) => Promise<void>;
    bunVersion: string;
    requiredBunVersionRange: string;
    logHandlerFactory: () => BaseHandler;
}

export async function main(
    bootData: BootData = {
        args: process.argv.slice(2),
        serverFactory: spawnServer,
        bunVersion: Bun.version,
        requiredBunVersionRange: REQUIRED_BUN_VERSION_RANGE,
        logHandlerFactory: consoleLogHandlerFactory,
    },
): Promise<number> {
    const options = parseOptions(bootData.args);
    if (typeof options === "number") {
        return options;
    }
    setupLogger(bootData.logHandlerFactory, options.debug);
    if (!bunVersionIsSatisfied(bootData.bunVersion, bootData.requiredBunVersionRange)) {
        log.error(
            `The installed version of Bun does not satisfy the required version range ${REQUIRED_BUN_VERSION_RANGE}.` +
                ` Please install a compatible Bun version and try again.`,
        );
        return 1;
    }
    await prepareConfigDir(options);
    shouldPrettifyTemplates(Boolean(options.debug));

    const settings = (await readSettings(options.configDir)) as Settings;
    if (typeof settings === "number") {
        return settings;
    }
    // Dependency Injection registration
    const database = new Database(buildDbPath(options.configDir));
    await container.bind({ provide: Database, useValue: database });
    await container.bind({ provide: SETTINGS, useValue: settings });
    await container.bind({ provide: CONFIG_DIR, useValue: options.configDir });
    database.migrate();

    log.debug(() => `IS_COMPILED is initialized as ${IS_COMPILED}`);

    await bootData.serverFactory({
        ...options,
        db: database,
        settings,
    });
    await database.dispose(); // FIXME remove this line when database is disposed by disposing of the container.
    /*// Right now it doesn't work because Database is constructed manually
    await container.dispose();*/
    return 0;
}

if (import.meta.main) {
    process.exitCode = await main();
}
