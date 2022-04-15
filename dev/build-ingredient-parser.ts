import { callAndWait, isWindows } from "./internal/util.ts";

await callAndWait(
  undefined,
  `peggy${isWindows() ? ".cmd" : ""}`,
  "--format",
  "es",
  "--output",
  "src/data/parse/ingredient/parser.js",
  "src/data/parse/ingredient/parser.pegjs",
).run();

await callAndWait(
  undefined,
  `terser${isWindows() ? ".cmd" : ""}`,
  "-c",
  "-m",
  "-o",
  "src/data/parse/ingredient/parser.js",
  "--",
  "src/data/parse/ingredient/parser.js",
).run();

const text = await Deno.readTextFile(
  "src/data/parse/ingredient/parser.js",
);
const preamble = `// deno-lint-ignore-file\n// deno-fmt-ignore-file`;
await Deno.writeTextFile(
  "src/data/parse/ingredient/parser.js",
  `${preamble}\n${text}`,
);
