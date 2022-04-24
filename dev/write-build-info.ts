const PATH = "out/server.js";
const SEARCH_STRING = `window["BUILD_INFO"]`;

async function execute(cmd: string[], fallback?: string): Promise<string | undefined> {
  const p = Deno.run({
    cmd,
    stdout: "piped",
    stderr: "piped",
  });
  const status = await p.status();
  if (!status.success) {
    return fallback;
  }
  return new TextDecoder().decode(await p.output()).trim();
}

const tag = await execute(["git", "describe", "--tags"]);
const commitHash = await execute(["git", "rev-parse", "--short", "HEAD"]);

const REPLACEMENT_STRING = `"Build ${commitHash}${tag ? ` (tag ${tag})` : ""} compiled ${new Date().toUTCString()}"`;

const source = Deno.readTextFileSync(PATH);
if (!source.includes(SEARCH_STRING)) {
  console.error(`Can't find "${SEARCH_STRING}" inside ${PATH}`);
  Deno.exit(1);
}
Deno.writeTextFileSync(PATH, source.replace(SEARCH_STRING, REPLACEMENT_STRING));
