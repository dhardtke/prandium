// deno-fmt-ignore-file
import { Recipe } from "../../../data/model/recipe.ts";
import { UrlGenerator } from "../../../http/util/url-generator.ts";
import { l } from "../../../i18n/mod.ts";
import { e, html } from "../../mod.ts";
import { Breadcrumb } from "../_components/breadcrumb.ts";
import { LabeledIcon } from "../_components/icon.ts";
import { Page } from "../_structure/page.ts";

export const RecipeDeleteTemplate = (recipe: Recipe) => Page(recipe.title)(html`
  ${Breadcrumb(
    false,
    { title: recipe.title, url: UrlGenerator.recipe(recipe) },
    { title: l.delete, url: UrlGenerator.recipeDelete(recipe) },
  )}

  <form method="POST">
    <h1>${e(l.confirmation)}</h1>
    <p>${e(l.recipe.deleteConfirmation)}</p>

    <div class="btn-bar">
      <a class="btn primary col-12 col-lg-4" href="${UrlGenerator.recipe(recipe)}">
        ${LabeledIcon(l.no, "arrow-left")}
      </a>
      <button type="submit" class="btn danger col-12 col-lg-4">
        ${LabeledIcon(l.yes, "trash")}
      </button>
    </div>
  </form>
`);
