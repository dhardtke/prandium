import { UrlHelper } from "../../http/url_helper.ts";
import { AppState } from "../../http/webserver.ts";
import { AssetsHelper } from "./assets_helper.ts";
import { FormatHelper } from "./format_helper.ts";
import { IngredientHelper } from "./ingredient_helper.ts";
import { TranslationHelper } from "./translation_helper.ts";

export type Helpers =
  | AssetsHelper
  | TranslationHelper
  | IngredientHelper
  | FormatHelper
  | { u: UrlHelper };

export function helperFactory(appState: AppState): Helpers {
  return {
    ...AssetsHelper.INSTANCE.api,
    ...TranslationHelper.INSTANCE.api,
    ...new IngredientHelper(
      appState.settings.ingredientSortOrder,
      appState.settings.ingredientUnitPostprocessing,
    ).api,
    ...FormatHelper.INSTANCE.api,
    ...{
      u: UrlHelper.INSTANCE,
    },
  };
}
