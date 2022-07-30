import { fs } from "../deps.ts";

const [dir] = Deno.args;

if (!dir) {
    console.error("Error: Required argument missing.");
    console.error("Usage: deno run --allow-write ensure-dir-exists.ts <directory>");
    Deno.exit(1);
}

fs.ensureDirSync(dir);
