// deno coverage --unstable cov_profile --lcov > cov_profile.lcov
import { path } from "../deps.ts";

Deno.chdir(path.dirname(path.fromFileUrl(import.meta.url)));
Deno.chdir("..");

const SOURCE_DIR = path.join("out", "coverage");
const OUTPUT_DIR = path.join("out", "coverage_html");

// remove output dir
try {
  await Deno.remove(OUTPUT_DIR, { recursive: true });
} catch {
  // ignore
}

const coverage = Deno.run({
  cmd: ["deno", "coverage", "--unstable", SOURCE_DIR, "--lcov"],
  stdout: "piped",
});
const output = await coverage.output();
const coverageStatus = await coverage.status();
if (coverageStatus.success && coverageStatus.code === 0) {
  const tmpFile = await Deno.makeTempFile({
    suffix: ".lcov",
  });
  await Deno.writeFileSync(tmpFile, output);
  const htmlStatus = await Deno.run({
    cmd: ["genhtml", "-o", OUTPUT_DIR, tmpFile],
  }).status();
  if (htmlStatus.success && htmlStatus.code === 0) {
    await Deno.remove(tmpFile);
    console.log(`Generated ${OUTPUT_DIR}`);
    Deno.exit(0);
  }
}
console.error("An error occurred. Please check the output on the screen.");
