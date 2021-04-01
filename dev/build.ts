import { Colors, fs, path } from "../deps.ts";
import { processAsync } from "./internal/util.ts";

Deno.chdir(path.dirname(path.fromFileUrl(import.meta.url)));
Deno.chdir("..");

interface Step {
  description: string;
  fn: () => Promise<unknown>;
}

// TODO build index.min.css and leave index.css unminified
const steps: Step[] = [
  {
    description: "Clean dist/ folder",
    fn: () => fs.emptyDir("assets/dist"),
  },
  {
    description: "Compile SCSS to CSS",
    fn: processAsync(
      "assets",
      "sass",
      "-I",
      "node_modules",
      "--style",
      "compressed",
      "index.scss",
      "dist/index.css",
    ),
  },
  {
    description: "Compile TS to JS",
    fn: processAsync("assets", "deno", "bundle", "index.ts", "dist/index.js"),
  },
  {
    description: "Minify JS",
    fn: processAsync(
      "assets",
      "esbuild",
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
    fn: processAsync(
      "assets/dist",
      "gzip",
      "-f",
      "-k",
      "index.css",
      "index.js",
      "index.min.js",
    ),
  },
  {
    description: "Compress assets (using brotli)",
    fn: processAsync(
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
    await step.fn();
    console.log(`${prefix} End`);
  }
}
