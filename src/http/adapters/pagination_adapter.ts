import {Oak} from "../../deps.ts";
import {toInt} from "../../util.ts";
import {Pagination, PaginationBuilder} from "../../data/pagination.ts";

declare module "https://deno.land/x/oak@v6.5.0/mod.ts" {
    interface Context {
        paginate: <T>(total: number, listSupplier: (limit: number, offset: number) => T[]) => Pagination<T>;
    }

    // noinspection JSUnusedGlobalSymbols
    interface RouterContext {
        paginate: <T>(total: number, listSupplier: (limit: number, offset: number) => T[]) => Pagination<T>;
    }
}

export const paginationAdapter = () => {
    return async function (ctx: Oak.Context, next: Function) {
        function extractParams() {
            const query = Oak.helpers.getQuery(ctx);

            return {
                page: toInt(query.page, 1),
                pageSize: toInt(query.pageSize, 25)
            }
        }

        ctx.paginate = function <T>(total: number, listSupplier: (limit: number, offset: number) => T[]): Pagination<T> {
            const {page, pageSize} = extractParams();

            return new PaginationBuilder<T>(total, page, pageSize)
                .build(listSupplier, ctx.request.url);
        };

        await next();
    };
};
