const PATH = "out/server.js";
const SEARCH_STRING = `window["IS_COMPILED"]`;
const REPLACEMENT_STRING = "true";

const source = Deno.readTextFileSync(PATH);
if (!source.includes(SEARCH_STRING)) {
  console.error(`Can't find "${SEARCH_STRING}" inside ${PATH}`);
  Deno.exit(1);
}
Deno.writeTextFileSync(PATH, source.replace(SEARCH_STRING, REPLACEMENT_STRING));
