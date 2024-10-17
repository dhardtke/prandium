import * as esbuild from "npm:esbuild";
import { denoPlugins } from "jsr:@luca/esbuild-deno-loader";

const config = Deno.args[0];
const entryPoint = Deno.args[1];
const outfile = Deno.args[2];

let parsedConfig = JSON.parse(Deno.readTextFileSync(config));
if (config.endsWith("deno.json")) {
    parsedConfig = {
        compilerOptions: parsedConfig.compilerOptions,
    };
}

await esbuild.build({
    plugins: [...denoPlugins({ loader: "portable" })],
    entryPoints: [entryPoint],
    outfile: outfile,
    bundle: true,
    format: "esm",
    /*define: {
        'globalThis.BUILD_INFO': `"SomeWeirdString"`
    },*/
    tsconfigRaw: JSON.stringify(parsedConfig),
});

esbuild.stop();
