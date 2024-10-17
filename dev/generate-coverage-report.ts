// deno coverage --unstable cov_profile --lcov > cov_profile.lcov
import { path } from "../deps.ts";

Deno.chdir(path.dirname(path.fromFileUrl(import.meta.url)));
Deno.chdir("..");

const SourceDir = path.join("out", "coverage");
const OutputDir = path.join("out", "coverage_html");

// remove output dir
try {
    await Deno.remove(OutputDir, { recursive: true });
} catch {
    // ignore
}

const coverage = new Deno.Command(Deno.execPath(), {
    args: ["coverage", "--unstable", SourceDir, "--lcov"],
    stdout: "piped",
});
const {stdout, success, code} = await coverage.output();
if (success && code.code === 0) {
    const tmpFile = await Deno.makeTempFile({
        suffix: ".lcov",
    });
    await Deno.writeFileSync(tmpFile, stdout);
    console.log(`Written ${tmpFile}`);
    const {success, code} = (await new Deno.Command("genhtml", {
        args: ["-o", OutputDir, tmpFile],
    }).output());
    if (success && code === 0) {
        await Deno.remove(tmpFile);
        console.log(`Generated ${OutputDir}`);
        Deno.exit(0);
    }
}
console.error("An error occurred. Please check the output on the screen.");
