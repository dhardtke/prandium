// deno-fmt-ignore-file
import { ImportResult } from "../../../data/parse/import/import_recipe.ts";
import { UrlGenerator } from "../../../http/util/url_generator.ts";
import { l } from "../../../i18n/mod.ts";
import { e, html } from "../../mod.ts";
import { Alert } from "../_components/alert.ts";
import { Breadcrumb } from "../_components/breadcrumb.ts";
import { Icon, LabeledIcon } from "../_components/icon.ts";
import { Page } from "../_structure/page.ts";

export const RecipeImportTemplate = (results?: ImportResult[]) =>
  Page(l.recipe.import.title)(html`
    ${Breadcrumb(
      false,
      { title: l.recipe.import.title, url: UrlGenerator.recipeImport() },
    )}
    ${
      results
        ? html`
          ${Alert("info", l.info, l.recipe.import.alert)}
          <div class="table-responsive">
            <table class="table table-striped table-hover">
              <thead>
              <tr>
                <th>#</th>
                <th>${e(l.recipe.import.sourceUrl)}</th>
                <th>${e(l.recipe.import.result)}</th>
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
                              <a class="btn success sm" href="${
                                e(UrlGenerator.recipe(result.recipe!))
                              }" target="_blank">
                                ${e(l.recipe.open)}
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
            <div class="mb">
              <label for="urls" class="form-label">
                ${e(l.recipe.import.urls)}
              </label>
              <textarea rows="10" class="form-control" id="urls" name="urls" required></textarea>
              <div class="form-text">
                ${e(l.recipe.import.urlInfo)}
              </div>
            </div>
            <button type="submit" class="btn primary">
              ${LabeledIcon(l.recipe.import.title, "cloud-arrow-down-fill")}
            </button>
          </form>
        `
    }
  `);
