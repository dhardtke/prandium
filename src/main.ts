import {initDb} from "./data/db.ts";
import {parse, path} from "./deps.ts";
import {spawnServer} from "./http/webserver.ts";

function parseOptions(): {dev: boolean, host: string, port: number} {
    const {
        dev,
        host,
        port
    } = parse(Deno.args, {
        default: {
            dev: false,
            host: "127.0.0.1",
            port: 8000
        }
    });
    return {dev: Boolean(dev), host, port};
}

async function main(): Promise<void> {
    const options = parseOptions();
    if (options.dev) {
        // TODO spawn dev server
    }
    Deno.chdir(path.dirname(path.fromFileUrl(import.meta.url)));
    initDb();
    await spawnServer(options.dev, options.host, options.port);
}

if (import.meta.main) {
    main().catch(e => console.error(e));
}
