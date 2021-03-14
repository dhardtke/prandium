// deno coverage --unstable cov_profile --lcov > cov_profile.lcov
import { path } from "./internal/deps.ts";

Deno.chdir(path.dirname(path.fromFileUrl(import.meta.url)));
Deno.chdir("..");

const coverage = Deno.run({
  cmd: ["deno", "coverage", "--unstable", "out/coverage", "--lcov"],
  stdout: "piped"
});
const coverageStatus = await coverage.status();
if (coverageStatus.success && coverageStatus.code === 0) {
  const tmpFile = await Deno.makeTempFile({
    suffix: ".lcov"
  });
  await Deno.writeFileSync(tmpFile, await coverage.output());
  const htmlStatus = await Deno.run({
    cmd: ["genhtml", "-o", "out/coverage_html", tmpFile],
  }).status();
  await Deno.remove(tmpFile);
  if (htmlStatus.success && htmlStatus.code === 0) {
    console.log(`Generated out/coverage_html`);
    Deno.exit(0);
  }
}
console.error("An error occurred. Please check the output on the screen.");
