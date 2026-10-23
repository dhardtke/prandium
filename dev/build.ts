/**
 * Builds the application.
 *
 * Usage: bun dev/build.ts <target> [--watch]
 *
 * Targets:
 *   assets  - compiles assets/index.scss to out/assets/index.css and bundles assets/index.ts to out/assets/index.js
 *             (with --watch: rebuilds whenever a file in assets/ changes)
 */
import { watch } from "node:fs";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import * as sass from "sass";
import { root } from "../src/shared/util.ts";

const OutDir = root("out");
const OutAssetsDir = path.join(OutDir, "assets");

function log(message: string) {
    console.log(`[build] ${message}`);
}

async function buildCss(): Promise<void> {
    const result = await sass.compileAsync(root("assets/index.scss"), {
        sourceMap: false,
        loadPaths: [root("node_modules")],
        // TODO migrate assets/scss/mixins/spacing.scss to the CSS if() syntax
        silenceDeprecations: ["if-function"],
    });
    await Bun.write(path.join(OutAssetsDir, "index.css"), result.css);
}

async function buildClientJs(): Promise<void> {
    const result = await Bun.build({
        entrypoints: [root("assets/index.ts")],
        outdir: OutAssetsDir,
        naming: "index.js",
        target: "browser",
        format: "esm",
    });
    if (!result.success) {
        throw new AggregateError(result.logs, "Bundling the client JavaScript failed");
    }
}

async function buildAssets(): Promise<void> {
    await mkdir(OutAssetsDir, { recursive: true });
    const start = performance.now();
    await Promise.all([buildCss(), buildClientJs()]);
    log(`Built assets in ${(performance.now() - start).toFixed(0)}ms`);
}

function watchAssets(): void {
    let timeout: Timer | undefined;
    watch(root("assets"), { recursive: true }, () => {
        // debounce as editors usually trigger multiple events per save
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            buildAssets().catch((e) => console.error(e));
        }, 100);
    });
    log("Watching assets/ for changes");
}

const [target, ...flags] = process.argv.slice(2);
switch (target) {
    case "assets":
        await buildAssets();
        if (flags.includes("--watch")) {
            watchAssets();
        }
        break;
    default:
        console.error(`Unknown target "${target}". Usage: bun dev/build.ts <assets> [--watch]`);
        process.exit(1);
}
