// deno-fmt-ignore-file
import { UrlGenerator } from "../../http/util/url_generator.ts";
import { e, html } from "../mod.ts";
import { t } from "../util/translation.ts";
import { Breadcrumb } from "./_components/breadcrumb.ts";
import { Page } from "./_structure/page.ts";

export const IndexTemplate = () => Page(e(t("home")))(html`
  ${Breadcrumb()}
  <div class="row row-cols-1 row-cols-md-3 g-4">
    <div class="col">
      <a class="card card-linked h-100" href="${UrlGenerator.recipeList()}">
        <h5 class="card-header">
          ${e(t("recipes"))}
        </h5>
        <div class="card-body">
          <p class="card-text">View all your recipes.</p>
        </div>
      </a>
    </div>

    <div class="col">
      <a class="card card-linked h-100" href="${UrlGenerator.recipeList()}">
        <h5 class="card-header">
          ${e(t("recipes"))}
        </h5>
        <div class="card-body">
          <p class="card-text">Manage all your recipes.</p>
        </div>
      </a>
    </div>

    <div class="col">
      <a class="card card-linked h-100" href="${UrlGenerator.recipeList()}">
        <h5 class="card-header">
          ${e(t("recipes"))}
        </h5>
        <div class="card-body">
          <p class="card-text">View statistics.</p>
        </div>
      </a>
    </div>
  </div>
`);
