import { Colors, fs, path } from "../deps.ts";
import { callAndWait, isWindows, ProcessLike } from "./internal/util.ts";

Deno.chdir(path.dirname(path.fromFileUrl(import.meta.url)));
Deno.chdir("..");

interface Step {
  description: string;
  process: ProcessLike;
}

// TODO build index.min.css and leave index.css unminified
const steps: Step[] = [
  {
    description: "Clean dist/ folder",
    process: {
      run() {
        return fs.emptyDir("assets/dist");
      },
    },
  },
  {
    description: "Compile SCSS to CSS",
    process: callAndWait(
      "assets",
      `sass${isWindows() ? ".cmd" : ""}`,
      "--no-source-map",
      "-I",
      "node_modules",
      "--style",
      "compressed",
      "index.scss",
      "dist/index.css",
    ),
  },
  {
    description: "Remove leftover comments from CSS",
    process: {
      async run() {
        // some comments aren't removed even when using --style compressed (e.g. "/* rtl: begin */") so we need to remove them manually
        const p = /\s*\/\*.*?\*\/\s*/g;
        const compiledCssFile = "assets/dist/index.css";
        let contents = await Deno.readTextFile(compiledCssFile);
        contents = contents.replaceAll(p, "");
        await Deno.writeTextFile(compiledCssFile, contents);
      },
    },
  },
  {
    description: "Compile TS to JS",
    process: callAndWait(
      "assets",
      "deno",
      "bundle",
      "--config=tsconfig.json",
      "index.ts",
      "dist/index.js",
    ),
  },
  {
    description: "Minify JS",
    process: callAndWait(
      "assets",
      `esbuild${isWindows() ? ".cmd" : ""}`,
      "--bundle",
      "--format=esm",
      "--minify",
      "dist/index.js",
      "--outfile=dist/index.min.js",
    ),
  },
  // {
  //     description: "Compile server",
  //     fn: processAsync("", "") // TODO
  // },
  {
    description: "Compress assets (using gzip)",
    process: callAndWait(
      "assets/dist",
      `gzip`,
      "-f",
      "-k",
      "index.css",
      "index.js",
      "index.min.js",
    ),
  },
  {
    description: "Compress assets (using brotli)",
    process: callAndWait(
      "assets/dist",
      "brotli",
      "-f",
      "-k",
      "index.css",
      "index.js",
      "index.min.js",
    ),
  },
];

if (import.meta.main) {
  for (const step of steps) {
    const prefix = Colors.blue(`[${step.description}]`);
    console.log(`${prefix} Start`);
    await step.process.run();
    console.log(`${prefix} End`);
  }
}
