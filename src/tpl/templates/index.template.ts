import { t } from "../helpers/translation_helper.ts";
import { UrlGenerator } from "../helpers/url_generator.ts";
import { html } from "../mod.ts";
import { Breadcrumb } from "./_components/breadcrumb.ts";
import { PageTemplate } from "./_structure/page.template.ts";

export function IndexTemplate() {
  return PageTemplate(t("home"))(html`
    ${Breadcrumb()}
    <div class="row row-cols-1 row-cols-md-3 g-4">
      <div class="col">
        <a class="card card-linked h-100" href="${UrlGenerator.recipeList()}">
          <h5 class="card-header">
            ${t("recipes")}
          </h5>
          <div class="card-body">
            <p class="card-text">View all your recipes.</p>
          </div>
        </a>
      </div>

      <div class="col">
        <a class="card card-linked h-100" href="${UrlGenerator.recipeList()}">
          <h5 class="card-header">
            ${t("recipes")}
          </h5>
          <div class="card-body">
            <p class="card-text">Manage all your recipes.</p>
          </div>
        </a>
      </div>

      <div class="col">
        <a class="card card-linked h-100" href="${UrlGenerator.recipeList()}">
          <h5 class="card-header">
            ${t("recipes")}
          </h5>
          <div class="card-body">
            <p class="card-text">View statistics.</p>
          </div>
        </a>
      </div>
    </div>
  `);
}
