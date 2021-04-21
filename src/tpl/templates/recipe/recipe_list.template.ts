import { Recipe } from "../../../data/model/recipe.ts";
import { Tag } from "../../../data/model/tag.ts";
import { Pagination } from "../../../data/pagination.ts";
import { date, number } from "../../../data/util/format.ts";
import {
  parameter,
  removeParameter,
  removeParameterValue,
} from "../../../http/util/parameters.ts";
import { UrlGenerator } from "../../../http/util/url_generator.ts";
import { e, html } from "../../mod.ts";
import { t } from "../../util/translation.ts";
import { Alert } from "../_components/alert.ts";
import { Breadcrumb } from "../_components/breadcrumb.ts";
import { Icon, LabeledIcon } from "../_components/icon.ts";
import { PaginationPartial } from "../_components/pagination.ts";
import { PageTemplate } from "../_structure/page.template.ts";

export const TagFilter = () =>
  html`
  <button class="btn btn-outline-info dropdown-toggle" type="button" data-bs-toggle="dropdown">${
    e(t("navigation.tags"))
  }
  </button>
  <div class="dropdown-menu p-2 dropdown-menu-lg-end" id="tag-filter">
    <div class="input-group mb-2">
        <span class="input-group-text">
          ${Icon("funnel")}
        </span>
      <input type="search" class="form-control input-filter" autocomplete="off" title="${
    e(t("navigation.filter_title"))
  }"
             placeholder="${e(t("navigation.filter_placeholder"))}">
      <button class="btn btn-outline-secondary btn-tag-clear" type="button">Clear</button>
    </div>
    <div class="overflow-auto list-group list-group-flush pe-2"></div>
    <template>
      <a class="list-group-item list-group-item-action d-flex justify-content-between align-items-center" href="">
        <div class="me-auto tag-title"></div>
        <span class="badge bg-dark rounded-pill tag-recipe-count"></span>
        <input type="hidden" name="tagId" value=""/>
      </a>
    </template>
  </div>
`;

function OrderBy(currentUrl: URL) {
  const orderBy = parameter(currentUrl, "orderBy", "title");

  const options = [
    ["id"],
    ["created_at"],
    ["updated_at"],
    ["title"],
    ["last_cooked_at", "recipe.last_cooked_at"],
    ["cooked_count", "recipe.cooked_count"],
    ["aggregate_rating_value", "recipe.aggregate_rating_value"],
    ["rating", "recipe.rating"],
    ["prep_time", "recipe.prep_time"],
    ["cook_time", "recipe.cook_time"],
    ["total_time", "recipe.total_time"],
  ];
  const order = parameter(currentUrl, "order", "ASC")?.toUpperCase();
  const otherOrder = order === "ASC" ? "DESC" : "ASC";

  return html`
    <form class="col" id="orderBy">
      <div class="input-group">
            <span class="input-group-text">
                ${e(t("order_by.title"))}
            </span>
        <select class="form-select" title="${
    e(t("recipe.order_by"))
  }" autocomplete="off" name="orderBy">
          ${
    options.map(([optionValue, optionLabel]) =>
      html`
                <option value="${optionValue}" ${
        orderBy === optionValue ? "selected" : ""
      }>
                  ${t(optionLabel || optionValue)}
                </option>`
    )
  }
        </select>

        <button class="btn btn-outline-secondary" type="submit" name="order" value="${otherOrder}"
                title="${t(`order_by.${otherOrder.toLowerCase()}`)}">
          ${Icon(order === "ASC" ? "arrow-down" : "arrow-up")}
        </button>
        ${
    [...currentUrl.searchParams.entries()]
      .filter(([name]) => !["orderBy", "order", "flash", "page"].includes(name))
      .map(([name, value]) =>
        html`<input type="hidden" name="${name}" value="${value}">`
      )
  }
      </div>
    </form>`;
}

export const RecipeListTemplate = (
  recipes: Pagination<Recipe>,
  tags: Tag[],
  currentUrl: URL,
) =>
  PageTemplate(t("recipes"))(html`
  ${Breadcrumb(false, { title: t("recipes"), url: UrlGenerator.recipeList() })}

  <div class="row g-3 mb-3">
    <form class="d-flex col-lg-9" method="get" action="${UrlGenerator.recipeList()}">
      <div class="input-group">
        <input class="form-control" type="search" name="title" placeholder="${
    e(t("search"))
  }" title="${e(t("search"))}"
               value="${parameter(currentUrl, "title")}">
        ${TagFilter()}
        <button class="btn btn-outline-info" type="submit">
          ${Icon("search")}
        </button>
      </div>
    </form>
    ${OrderBy(currentUrl)}
  </div>

  ${tags.length && html`
    <div class="d-flex flex-wrap">
      ${
    tags.map((tag, i) =>
      html`
            <a title="${e(tag.description)}" href="${
        removeParameterValue(currentUrl, "tagId", tag.id)
      }"
               class="badge badge-linked bg-secondary mb-3${i <
          tags.length - 1 &&
        " me-1"}">
              <div class="d-flex align-items-center h-100">
                ${LabeledIcon(tag.title, "x-circle-fill")}
              </div>
            </a>`
    )
  }

      ${tags.length > 1 && html`
        <a href="${
    e(removeParameter(currentUrl, "tagId"))
  }" class="badge badge-linked bg-danger ms-2 mb-3">
          <div class="d-flex align-items-center h-100">
            ${LabeledIcon(t("recipe.clear_all_tags"), "x-circle-fill")}
          </div>
        </a>`}
    </div>
  `}

  ${currentUrl.searchParams.get("flash") === "deleteSuccessful" &&
    Alert("success", t("info"), t("recipe.delete_successful"))}

  ${
    recipes.totalItems
      ? html`
        <div class="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
          ${
        recipes.items.map((recipe) =>
          html`
                <div class="col">
                  <div class="recipe h-100">
                    <div class="dropdown">
                      <button class="btn btn-light dropdown-toggle no-caret" type="button" data-bs-toggle="dropdown">
                        ${Icon("three-dots")}
                      </button>
                      <ul class="dropdown-menu dropdown-menu-end">
                        <li>
                          <a class="dropdown-item text-primary" href="${
            UrlGenerator.recipeEdit(recipe)
          }">
                            ${LabeledIcon(t("edit"), "pencil")}
                          </a>
                        </li>
                        <li>
                          <hr class="dropdown-divider">
                        </li>
                        <li>
                          <a class="dropdown-item text-danger" href="${
            UrlGenerator.recipeDelete(recipe)
          }">
                            ${LabeledIcon(t("delete"), "trash")}
                          </a>
                        </li>
                      </ul>
                    </div>
                    <a class="card card-linked h-100" href="${
            UrlGenerator.recipe(recipe)
          }">
                      <img src="${
            UrlGenerator.thumbnail(recipe.thumbnail)
          }" class="card-img-top" alt="" loading="lazy">
                      <div class="card-body">
                        <h5 class="card-title">${e(recipe.title)}</h5>
                        <p class="card-text">${e(recipe.description)}</p>
                        <p class="card-text">
                          <small class="text-muted">
                            ${
            recipe.lastCookedAt
              ? e(t("recipe.last_cooked", {
                distance: date.formatDistanceToNow(recipe.lastCookedAt),
              }))
              : e(t("recipe.not_cooked_yet"))
          }
                          </small>
                        </p>
                      </div>
                      <div class="card-footer text-muted d-flex justify-content-between">
                        <div>
                    <span title="${e(t("recipe.cooked_count"))}" class="me-2">
                        ${LabeledIcon(recipe.cookedCount, "bar-chart")}
                    </span>
                          <span title="${e(t("recipe.rating"))}" class="me-2">
                        ${LabeledIcon(number.format(recipe.rating), "star")}
                    </span>
                          <span title="${e(t("recipe.aggregate_rating"))}">
                      ${
            LabeledIcon(number.format(recipe.aggregateRatingValue), "people")
          }
                    </span>
                        </div>

                        <span class="d-flex align-items-center" title="${
            e(t("recipe.time.total"))
          }">
                    ${
            LabeledIcon(date.formatSeconds(recipe.totalTime!), "clock-fill")
          }
                  </span>
                      </div>
                    </a>
                  </div>
                </div>
              `
        )
      }
        </div>
      `
      : Alert("info", t("info"), t("recipe.no_recipes.found"))
  }

  ${PaginationPartial(recipes)}

  <a class="btn btn-primary me-2" href="${UrlGenerator.recipeCreate()}" role="button">
    ${LabeledIcon(t("create"), "plus-square", 2)}
  </a>

  <a class="btn btn-success" href="${UrlGenerator.recipeImport()}" role="button">
    ${LabeledIcon(t("recipe.import.title"), "cloud-arrow-down-fill", 2)}
  </a>
`);
