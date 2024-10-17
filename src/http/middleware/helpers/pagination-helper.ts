import { needle, Oak } from "../../../../deps.ts";
import { PaginationParams } from "../../../data/pagination.ts";
import { type Settings } from "../../../data/settings.ts";
import { toInt } from "../../../data/util/convert.ts";
import { SETTINGS } from "../../../di.ts";
import { parameters } from "../../util/parameters.ts";
import { copyUrlAndDo } from "../../util/url.ts";

@needle.injectable()
export class PaginationHelper {
    constructor(private settings: Settings = needle.inject(SETTINGS)) {
    }

    buildPaginationParams(ctx: Oak.Context): PaginationParams {
        return {
            page: toInt(parameters(ctx).get("page"), 1),
            pageSize: toInt(
                parameters(ctx).get("pageSize"),
                this.settings.pageSize,
            ),
            currentUrl: copyUrlAndDo(ctx.request.url, (url) => url.searchParams.delete("flash")).toString(),
        };
    }
}
