import { callAndWait } from "./internal/util.ts";

const Grammar = "src/data/parse/ingredient/parser.pegjs";
const Parser = "src/data/parse/ingredient/parser.js";

// "bun x" runs the locally installed binaries of peggy and terser
await callAndWait(undefined, process.execPath, "x", "peggy", "--format", "es", "--output", Parser, Grammar).run();

await callAndWait(undefined, process.execPath, "x", "terser", "-c", "-m", "-o", Parser, "--", Parser).run();

// the generated file is excluded from formatting in bunfig.toml
const preamble = `/* oxlint-disable */`;
await Bun.write(Parser, `${preamble}\n${await Bun.file(Parser).text()}`);
