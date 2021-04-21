import { Recipe } from "../../../data/model/recipe.ts";
import { UrlGenerator } from "../../../http/util/url_generator.ts";
import { html } from "../../mod.ts";
import { t } from "../../util/translation.ts";
import { Breadcrumb } from "../_components/breadcrumb.ts";
import { LabeledIcon } from "../_components/icon.ts";
import { PageTemplate } from "../_structure/page.template.ts";

export const RecipeDeleteTemplate = (recipe: Recipe) =>
  PageTemplate(recipe.title)(html`
  ${
    Breadcrumb(
      false,
      { title: t("recipes"), url: UrlGenerator.recipeList() },
      { title: recipe.title, url: UrlGenerator.recipe(recipe) },
      { title: t("delete"), url: UrlGenerator.recipeDelete(recipe) },
    )
  }

  <form method="POST">
    <h1>${t("confirmation")}</h1>
    <p>${t("recipe.delete_confirmation")}</p>

    <a class="btn btn-primary me-2" href="${UrlGenerator.recipe(recipe)}">
      ${LabeledIcon(t("no"), "arrow-left", 2)}
    </a>
    <button type="submit" class="btn btn-danger">
      ${LabeledIcon(t("yes"), "trash", 2)}
    </button>
  </form>

`);
