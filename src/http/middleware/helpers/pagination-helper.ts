import * as needle from "@needle-di/core";
import { PaginationParams } from "../../../data/pagination.ts";
import { type Settings } from "../../../data/settings.ts";
import { toInt } from "../../../data/util/convert.ts";
import { SETTINGS } from "../../../di.ts";
import { parameters } from "../../util/parameters.ts";
import { copyUrlAndDo } from "../../util/url.ts";

@needle.injectable()
export class PaginationHelper {
    constructor(private settings: Settings = needle.inject(SETTINGS)) {}

    buildPaginationParams(url: URL): PaginationParams {
        return {
            page: toInt(parameters(url).get("page"), 1),
            pageSize: toInt(parameters(url).get("pageSize"), this.settings.pageSize),
            currentUrl: copyUrlAndDo(url, (url) => url.searchParams.delete("flash")).toString(),
        };
    }
}
