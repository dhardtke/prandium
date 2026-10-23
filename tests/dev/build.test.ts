import { expect, test } from "bun:test";
import { existsSync } from "node:fs";
import path from "node:path";
import { root } from "../../src/shared/util.ts";
import { withTemp } from "../_internal/with-temp.function.ts";

async function run(...cmd: string[]): Promise<{ exitCode: number; stdout: string; stderr: string }> {
    const p = Bun.spawn(cmd, { cwd: root(), stdout: "pipe", stderr: "pipe" });
    const [stdout, stderr, exitCode] = await Promise.all([new Response(p.stdout).text(), new Response(p.stderr).text(), p.exited]);
    return { exitCode, stdout, stderr };
}

test(
    "the release build creates the minified, compressed assets and a runnable server bundle containing the build info",
    withTemp(async (tmpDir) => {
        const outDir = path.join(tmpDir, "out");

        const build = await run(process.execPath, "dev/build.ts", "build", `--outDir=${outDir}`);
        expect(build.exitCode, build.stderr).toEqual(0);

        for (const file of ["index.min.js", "index.min.css"]) {
            for (const suffix of ["", ".br", ".gz"]) {
                expect(existsSync(path.join(outDir, "assets", file + suffix)), file + suffix).toEqual(true);
            }
        }
        for (const asset of ["icons.svg", "placeholder.svg", "sw.js", "favicons"]) {
            expect(existsSync(path.join(outDir, "assets", asset)), asset).toEqual(true);
        }
        const server = await Bun.file(path.join(outDir, "server.js")).text();
        expect(server).toMatch(/Build \w+ (\(tag .+\) )?compiled /);

        const help = await run(process.execPath, path.join(outDir, "server.js"), "--help");
        expect(help.exitCode, help.stderr).toEqual(0);
        expect(help.stdout).toContain("--configDir");
    }),
    120_000,
);
