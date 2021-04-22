// deno-fmt-ignore-file
import { ImportResult } from "../../../data/parse/import/import_recipe.ts";
import { UrlGenerator } from "../../../http/util/url_generator.ts";
import { e, html } from "../../mod.ts";
import { t } from "../../util/translation.ts";
import { Alert } from "../_components/alert.ts";
import { Breadcrumb } from "../_components/breadcrumb.ts";
import { Icon, LabeledIcon } from "../_components/icon.ts";
import { Page } from "../_structure/page.ts";

export const RecipeImportTemplate = (results?: ImportResult[]) =>
  Page(t("recipe.import.title"))(html`
    ${Breadcrumb(
      false,
      { title: t("recipes"), url: UrlGenerator.recipeList() },
      { title: t("recipe.import.title"), url: UrlGenerator.recipeImport() },
    )}
    ${
      results
        ? html`
          ${Alert("info", t("info"), t("recipe.import.alert"))}
          <div class="table-responsive">
            <table class="table table-striped table-hover">
              <thead>
              <tr>
                <th>#</th>
                <th>${e(t("recipe.import.source_url"))}</th>
                <th>${e(t("recipe.import.result"))}</th>
              </tr>
              </thead>
              <tbody>
              ${
                results.map((result, i) =>
                  html`
                    <tr>
                      <td>${i + 1}</td>
                      <td>
                        <a href="${e(result.url)}" target="_blank">
                          ${e(result.url)}
                        </a>
                      </td>
                      <td class="d-flex align-items-center">
                        ${
                          result.success
                            ? html`
                              <span class="text-success me-1">${
                                Icon("check")
                              }</span>
                              <a class="btn btn-success btn-sm" href="${
                                e(UrlGenerator.recipe(result.recipe!))
                              }" target="_blank">
                                ${e(t("recipe.open"))}
                              </a>
                            `
                            : html`<span class="text-danger">${Icon("x")}${
                              e(result.error)
                            }</span>`
                        }
                      </td>
                    </tr>
                  `
                )
              }
              </tbody>
            </table>
          </div>
        `
        : html`
          <form method="POST">
            <div class="mb-3">
              <label for="urls" class="form-label">
                ${e(t("recipe.import.urls"))}
              </label>
              <textarea rows="10" class="form-control" id="urls" name="urls" required></textarea>
              <div class="form-text">
                ${e(t("recipe.import.url_info"))}
              </div>
            </div>
            <button type="submit" class="btn btn-primary">
              ${LabeledIcon(t("recipe.import.title"), "cloud-arrow-down-fill", 2)}
            </button>
          </form>
        `
    }
  `);