// deno-fmt-ignore-file
import { Recipe } from "../../../data/model/recipe.ts";
import { UrlGenerator } from "../../../http/util/url_generator.ts";
import { l } from "../../../i18n/mod.ts";
import { e, html } from "../../mod.ts";
import { Breadcrumb } from "../_components/breadcrumb.ts";
import { LabeledIcon } from "../_components/icon.ts";
import { Page } from "../_structure/page.ts";

export const RecipeDeleteTemplate = (recipe: Recipe) => Page(recipe.title)(html`
  ${Breadcrumb(
    false,
    { title: l.recipes, url: UrlGenerator.recipeList() },
    { title: recipe.title, url: UrlGenerator.recipe(recipe) },
    { title: l.delete, url: UrlGenerator.recipeDelete(recipe) },
  )}

  <form method="POST">
    <h1>${e(l.confirmation)}</h1>
    <p>${e(l.recipe.deleteConfirmation)}</p>

    <a class="btn btn-primary me-2" href="${UrlGenerator.recipe(recipe)}">
      ${LabeledIcon(l.no, "arrow-left", 2)}
    </a>
    <button type="submit" class="btn btn-danger">
      ${LabeledIcon(l.yes, "trash", 2)}
    </button>
  </form>
`);
