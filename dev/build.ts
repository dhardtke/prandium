import {Colors, path} from "./deps.ts";
import {processAsync} from "./util.ts";

Deno.chdir(path.dirname(path.fromFileUrl(import.meta.url)));
Deno.chdir("..");

interface Step {
    description: string;
    fn: () => Promise<any>;
}

const steps: Step[] = [
    {
        description: "Compile SCSS to CSS",
        fn: processAsync("assets", "sass", "-I", "node_modules", "--style", "compressed", "index.scss", "dist/index.css")
    },
    {
        description: "Compile TS to JS",
        fn: processAsync("assets", "deno", "bundle", "index.ts", "dist/index.js")
    },
    // {
    //     description: "Compile server",
    //     fn: processAsync("", "") // TODO
    // },
    {
        description: "Compress assets (using gzip)",
        fn: processAsync("assets/dist", "gzip", "-f", "-k", "index.css", "index.js")
    },
    {
        description: "Compress assets (using brotli)",
        fn: processAsync("assets/dist", "brotli", "-f", "-k", "index.css", "index.js")
    }
];

if (import.meta.main) {
    for (const step of steps) {
        const prefix = Colors.blue(`[${step.description}]`);
        console.log(`${prefix} Start`);
        await step.fn();
        console.log(`${prefix} End`);
    }
}
