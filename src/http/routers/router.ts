import { Handler, Method, RouteTable } from "../server/types.ts";

export abstract class Router {
    private readonly table: RouteTable = {};

    protected constructor(private readonly prefix = "") {}

    /**
     * Registers a handler for GET requests (Bun.serve answers HEAD requests with the GET handler, omitting the body).
     */
    protected get(path: string, handler: Handler): this {
        return this.add("GET", path, handler);
    }

    protected post(path: string, handler: Handler): this {
        return this.add("POST", path, handler);
    }

    routes(): RouteTable {
        return this.table;
    }

    private add(method: Method, path: string, handler: Handler): this {
        const fullPath = this.prefix + path;
        this.table[fullPath] = { ...this.table[fullPath], [method]: handler };
        return this;
    }
}
