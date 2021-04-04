import { UrlHelper } from "../../http/url_helper.ts";
import { AssetsHelper } from "./assets_helper.ts";
import { FormatHelper } from "./format_helper.ts";
import { IngredientHelper } from "./ingredient_helper.ts";
import { TranslationHelper } from "./translation_helper.ts";

export const Helpers = {
  ...AssetsHelper.INSTANCE.api,
  ...TranslationHelper.INSTANCE.api,
  ...IngredientHelper.INSTANCE.api,
  ...FormatHelper.INSTANCE.api,
  ...{
    u: UrlHelper.INSTANCE,
  },
};
