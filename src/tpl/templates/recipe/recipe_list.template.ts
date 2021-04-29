// deno-fmt-ignore-file
import { Recipe } from "../../../data/model/recipe.ts";
import { Tag } from "../../../data/model/tag.ts";
import { Pagination } from "../../../data/pagination.ts";
import { date, number } from "../../../data/util/format.ts";
import { parameter, removeParameter, removeParameterValue, } from "../../../http/util/parameters.ts";
import { UrlGenerator } from "../../../http/util/url_generator.ts";
import { l } from "../../../i18n/mod.ts";
import { e, html } from "../../mod.ts";
import { Alert } from "../_components/alert.ts";
import { Breadcrumb } from "../_components/breadcrumb.ts";
import { Icon, LabeledIcon } from "../_components/icon.ts";
import { Pagination as PaginationComponent } from "../_components/pagination.ts";
import { Page } from "../_structure/page.ts";

export const TagFilter = () =>
  html`
    <button class="btn btn-outline-info dropdown-toggle" type="button" data-bs-toggle="dropdown">${e(l.navigation.tags)}</button>
    <div class="dropdown-menu p-2 dropdown-menu-lg-end" id="tag-filter">
      <div class="input-group mb-2">
        <span class="input-group-text">
          ${Icon("funnel")}
        </span>
        <input type="search" class="form-control input-filter" autocomplete="off" title="${e(l.navigation.filterTitle)}"
               placeholder="${e(l.navigation.filterPlaceholder)}">
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

function OrderBy() {
  const orderBy = parameter(Page.currentUrl, "orderBy", "title");

  const options = [
    ["id", l.id],
    ["created_at", l.createdAt],
    ["updated_at", l.updatedAt],
    ["title", l.title],
    ["last_cooked_at", l.recipe.lastCookedAt],
    ["cooked_count", l.recipe.cookedCount],
    ["aggregate_rating_value", l.recipe.aggregateRatingValue],
    ["rating", l.recipe.rating],
    ["prep_time", l.recipe.prepTime],
    ["cook_time", l.recipe.cookTime],
    ["total_time", l.recipe.time.total],
  ];
  const order = parameter(Page.currentUrl, "order", "ASC")?.toUpperCase();
  const otherOrder = order === "ASC" ? "DESC" : "ASC";
  const otherOrderLabel = otherOrder === "ASC" ? l.orderBy.asc : l.orderBy.desc;

  return html`
    <form class="col" id="orderBy">
      <div class="input-group">
        <span class="input-group-text">
            ${e(l.orderBy.title)}
        </span>
        <select class="form-select" title="${e(l.recipe.orderBy)}" autocomplete="off" name="orderBy">
          ${options.map(([optionValue, optionLabel]) => html`
            <option value="${optionValue}" ${orderBy === optionValue && "selected"}>
              ${optionLabel}
            </option>`)}
        </select>

        <button class="btn btn-outline-secondary" type="submit" name="order" value="${otherOrder}"
                title="${otherOrderLabel}">
          ${Icon(order === "ASC" ? "arrow-down" : "arrow-up")}
        </button>
        ${[...Page.currentUrl.searchParams.entries()]
          .filter(([name]) => !["orderBy", "order", "flash", "page"].includes(name))
          .map(([name, value]) => html`<input type="hidden" name="${name}" value="${value}">`)}
      </div>
    </form>`;
}

const ActionButtons = () => html`
  <div class="d-flex justify-content-end">
    <a class="btn btn-primary me-2" href="${UrlGenerator.recipeCreate()}" role="button">
      ${LabeledIcon(l.create, "plus-square", 2)}
    </a>

    <a class="btn btn-success" href="${UrlGenerator.recipeImport()}" role="button">
      ${LabeledIcon(l.recipe.import.title, "cloud-arrow-down-fill", 2)}
    </a>
  </div>
`;

export const RecipeListTemplate = (
  recipes: Pagination<Recipe>,
  tags: Tag[],
  infiniteScrolling: boolean,
) => Page(l.recipes)(html`
  <div class="d-flex align-items-center justify-content-between mb-3">
    ${Breadcrumb(true, { title: l.recipes, url: UrlGenerator.recipeList() })}

    ${ActionButtons()}
  </div>

  <div class="row g-3 mb-3">
    <form class="d-flex col-lg-9" action="${UrlGenerator.recipeList()}">
      <div class="input-group">
        <input class="form-control" type="search" name="title" placeholder="${e(l.search)}" title="${e(l.search)}"
               value="${parameter(Page.currentUrl, "title")}">
        ${TagFilter()}
        <button class="btn btn-outline-info" type="submit">
          ${Icon("search")}
        </button>
      </div>
    </form>
    ${OrderBy()}
  </div>

  ${tags.length && html`
    <div class="d-flex flex-wrap">
      ${tags.map((tag, i) => html`
        <a title="${e(tag.description)}" href="${removeParameterValue(Page.currentUrl, "tagId", tag.id)}"
           class="badge badge-linked bg-secondary mb-3${i < tags.length - 1 && " me-1"}">
          <div class="d-flex align-items-center h-100">
            ${LabeledIcon(tag.title, "x-circle-fill")}
          </div>
        </a>`
      )}

      ${tags.length > 1 && html`
        <a href="${e(removeParameter(Page.currentUrl, "tagId"))}" class="badge badge-linked bg-danger ms-2 mb-3">
          <div class="d-flex align-items-center h-100">
            ${LabeledIcon(l.recipe.clearAllTags, "x-circle-fill")}
          </div>
        </a>`}
    </div>
  `}

  ${Page.currentUrl.searchParams.get("flash") === "deleteSuccessful" && Alert("success", l.info, l.recipe.deleteSuccessful)}
  ${recipes.totalItems
    ? html`
      <div class="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4" id="recipe-list" data-infinite-scrolling="${infiniteScrolling + ""}">
        ${recipes.items.map((recipe) => html`
          <div class="col">
            <div class="recipe h-100">
              <div class="dropdown">
                <button class="btn btn-light dropdown-toggle no-caret" type="button" data-bs-toggle="dropdown">
                  ${Icon("three-dots")}
                </button>
                <ul class="dropdown-menu dropdown-menu-end">
                  <li>
                    <a class="dropdown-item text-primary" href="${UrlGenerator.recipeEdit(recipe)}">
                      ${LabeledIcon(l.edit, "pencil")}
                    </a>
                  </li>
                  <li>
                    <hr class="dropdown-divider">
                  </li>
                  <li>
                    <a class="dropdown-item text-danger" href="${UrlGenerator.recipeDelete(recipe)}">
                      ${LabeledIcon(l.delete, "trash")}
                    </a>
                  </li>
                </ul>
              </div>
              <a class="card card-linked h-100" href="${UrlGenerator.recipe(recipe)}">
                <img src="${UrlGenerator.thumbnail(recipe.thumbnail)}" class="card-img-top" alt="" loading="lazy">
                <div class="card-body">
                  <h5 class="card-title text-clamp">${e(recipe.title)}</h5>
                  <p class="card-text text-clamp">${e(recipe.description)}</p>
                  <p class="card-text">
                    <small class="text-muted" ${recipe.lastCookedAt && `title=${date.format(recipe.lastCookedAt)}`}>
                      ${
                        recipe.lastCookedAt
                          ? e(l.recipe.lastCooked(date.formatDistanceToNow(recipe.lastCookedAt)))
                          : e(l.recipe.notCookedYet)
                      }
                    </small>
                  </p>
                </div>
                <div class="card-footer text-muted d-flex justify-content-between">
                  <div>
                    <span title="${e(l.recipe.cookedCount)}" class="me-2">
                      ${LabeledIcon(recipe.cookedCount, "bar-chart")}
                    </span>
                    <span title="${e(l.recipe.rating)}" class="me-2">
                      ${LabeledIcon(number.format(recipe.rating), "star")}
                    </span>
                    <span title="${e(l.recipe.aggregateRating)}">
                      ${LabeledIcon(number.format(recipe.aggregateRatingValue), "people")}
                    </span>
                  </div>

                  <span class="d-flex align-items-center" title="${e(l.recipe.time.total)}">
                    ${LabeledIcon(date.formatSeconds(recipe.totalTime!), "clock-fill")}
                  </span>
                </div>
              </a>
            </div>
          </div>
        `)}
        ${infiniteScrolling && html`
          <div data-cmp="Observer" class="observer"></div>`}
      </div>
    ` : Alert("info", l.info, l.recipe.noRecipesFound)
  }

  ${PaginationComponent(recipes)}

  ${ActionButtons()}
`);
