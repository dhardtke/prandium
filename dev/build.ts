/**
 * Builds the application.
 *
 * Usage: bun dev/build.ts <target> [--watch] [--outDir=<dir>]
 *
 * Targets:
 *   assets  - compiles assets/index.scss to <outDir>/assets/index.css and bundles assets/index.ts to <outDir>/assets/index.js
 *             (with --watch: rebuilds whenever a file in assets/ changes)
 *   build   - the release build: cleans <outDir>, copies the static assets, builds the assets, minifies and compresses them
 *             and bundles the server into <outDir>/server.js
 *
 * <outDir> defaults to out/.
 */
import { watch } from "node:fs";
import { cp, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";
import { brotliCompressSync, constants as zlibConstants, gzipSync } from "node:zlib";
import * as sass from "sass";
import { root } from "../src/shared/util.ts";

const { values: flags, positionals } = parseArgs({
    args: process.argv.slice(2),
    allowPositionals: true,
    options: {
        watch: { type: "boolean", default: false },
        outDir: { type: "string", default: root("out") },
    },
});
const OutDir = path.resolve(flags.outDir);
const OutAssetsDir = path.join(OutDir, "assets");

const StaticAssets = ["favicons", "icons.svg", "placeholder.svg", "sw.js"];

function log(message: string) {
    console.log(`[build] ${message}`);
}

function assertSuccess(result: Bun.BuildOutput, what: string): void {
    if (!result.success) {
        throw new AggregateError(result.logs, `${what} failed`);
    }
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

async function buildClientJs(minify: boolean): Promise<void> {
    const result = await Bun.build({
        entrypoints: [root("assets/index.ts")],
        outdir: OutAssetsDir,
        naming: minify ? "index.min.js" : "index.js",
        target: "browser",
        format: "esm",
        minify,
    });
    assertSuccess(result, "Bundling the client JavaScript");
}

async function buildAssets(): Promise<void> {
    await mkdir(OutAssetsDir, { recursive: true });
    const start = performance.now();
    await Promise.all([buildCss(), buildClientJs(false)]);
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

async function minifyCss(): Promise<void> {
    const result = await Bun.build({
        entrypoints: [path.join(OutAssetsDir, "index.css")],
        outdir: OutAssetsDir,
        naming: "index.min.css",
        minify: true,
    });
    assertSuccess(result, "Minifying the CSS");
}

async function compress(file: string): Promise<void> {
    const contents = await Bun.file(file).bytes();
    await Bun.write(`${file}.br`, brotliCompressSync(contents, { params: { [zlibConstants.BROTLI_PARAM_QUALITY]: zlibConstants.BROTLI_MAX_QUALITY } }));
    await Bun.write(`${file}.gz`, gzipSync(contents, { level: 9 }));
}

async function git(...args: string[]): Promise<string | undefined> {
    try {
        const p = Bun.spawn(["git", ...args], { cwd: root(), stdout: "pipe", stderr: "ignore" });
        const [output, exitCode] = await Promise.all([new Response(p.stdout).text(), p.exited]);
        return exitCode === 0 ? output.trim() : undefined;
    } catch {
        return undefined;
    }
}

export async function buildInfo(): Promise<string> {
    const tag = await git("describe", "--tags");
    const commitHash = await git("rev-parse", "--short", "HEAD");
    return `Build ${commitHash}${tag ? ` (tag ${tag})` : ""} compiled ${new Date().toUTCString()}`;
}

async function buildServer(info: string): Promise<void> {
    const result = await Bun.build({
        entrypoints: [root("src/main.ts")],
        outdir: OutDir,
        naming: "server.js",
        target: "bun",
        format: "esm",
        minify: true,
        define: {
            "globalThis.BUILD_INFO": JSON.stringify(info),
        },
    });
    assertSuccess(result, "Bundling the server");
}

async function build(): Promise<void> {
    const start = performance.now();
    await rm(OutDir, { recursive: true, force: true });
    await mkdir(OutAssetsDir, { recursive: true });
    for (const asset of StaticAssets) {
        await cp(root("assets", asset), path.join(OutAssetsDir, asset), { recursive: true });
    }

    await buildAssets();
    await Promise.all([minifyCss(), buildClientJs(true)]);
    await Promise.all(["index.min.css", "index.min.js"].map((file) => compress(path.join(OutAssetsDir, file))));

    const info = await buildInfo();
    await buildServer(info);
    log(`${info}: built ${path.relative(root(), OutDir) || "."} in ${(performance.now() - start).toFixed(0)}ms`);
}

const [target] = positionals;
switch (target) {
    case "assets":
        await buildAssets();
        if (flags.watch) {
            watchAssets();
        }
        break;
    case "build":
        await build();
        break;
    default:
        console.error(`Unknown target "${target}". Usage: bun dev/build.ts <assets|build> [--watch] [--outDir=<dir>]`);
        process.exit(1);
}
