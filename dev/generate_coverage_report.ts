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

const coverage = Deno.run({
  cmd: ["deno", "coverage", "--unstable", SourceDir, "--lcov"],
  stdout: "piped",
});
const output = await coverage.output();
const coverageStatus = await coverage.status();
if (coverageStatus.success && coverageStatus.code === 0) {
  const tmpFile = await Deno.makeTempFile({
    suffix: ".lcov",
  });
  await Deno.writeFileSync(tmpFile, output);
  console.log(`Written ${tmpFile}`);
  const htmlStatus = await Deno.run({
    cmd: ["genhtml", "-o", OutputDir, tmpFile],
  }).status();
  if (htmlStatus.success && htmlStatus.code === 0) {
    await Deno.remove(tmpFile);
    console.log(`Generated ${OutputDir}`);
    Deno.exit(0);
  }
}
console.error("An error occurred. Please check the output on the screen.");
