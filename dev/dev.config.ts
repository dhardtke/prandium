import {DevServerConfig} from "./dev-server.ts";

const config: DevServerConfig = {
    watchPaths: [
        "src",
        "assets"
    ],
    actions: [
        {
            id: "Server",
            match: /\/src\/(.+)\.(ts|html)/,
            cmd: ["deno", "run", "--no-check", "--allow-net=127.0.0.1", "--allow-read", "--allow-write", "--unstable", "src/main.ts", "--dev"]
        },
        {
            id: "JS",
            match: /\/assets\/(.+)\.(ts)/,
            cmd: ["deno", "bundle", "--unstable", "assets/index.ts", "assets/dist/index.js"]
        },
        {
            id: "SCSS",
            match: /\/assets\/(.+)\.(scss)/,
            cmd: ["sass.cmd", "-I", "assets/node_modules", "assets/index.scss", "assets/dist/index.css"]
        }
    ]
};

export default config;
