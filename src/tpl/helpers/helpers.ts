import {IconHelper} from "./icon_helper.ts";
import {TranslationHelper} from "./translation_helper.ts";

export interface Helper {
    api: { [key: string]: any };
}

export const Helpers = {
    ...TranslationHelper.INSTANCE.api,
    ...IconHelper.INSTANCE.api
}
