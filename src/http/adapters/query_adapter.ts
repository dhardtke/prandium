import {Oak} from "../../deps.ts";

declare module "https://deno.land/x/oak@v6.5.0/mod.ts" {
    interface Context {
        _query: Record<string, string>;
        queryParameter: (name: string) => string;
    }

    // noinspection JSUnusedGlobalSymbols
    interface RouterContext {
        _query: Record<string, string>;
        queryParameter: (name: string) => string;
    }
}

export const queryAdapter = () => {
    return async function (ctx: Oak.Context, next: () => void) {
        ctx.queryParameter = function (name: string): string {
            if (!ctx._query) {
                ctx._query = Oak.helpers.getQuery(ctx);
            }

            return ctx._query[name];
        };

        await next();
    };
};
