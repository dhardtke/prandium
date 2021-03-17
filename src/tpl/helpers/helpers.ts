import { DateHelper } from "./date_helper.ts";
import { IconHelper } from "./icon_helper.ts";
import { IngredientHelper } from "./ingredient_helper.ts";
import { TranslationHelper } from "./translation_helper.ts";
import { UrlHelper } from "./url_helper.ts";

export const Helpers = {
  ...TranslationHelper.INSTANCE.api,
  ...IconHelper.INSTANCE.api,
  ...IngredientHelper.INSTANCE.api,
  ...DateHelper.INSTANCE.api,
  ...UrlHelper.INSTANCE.api,
};
