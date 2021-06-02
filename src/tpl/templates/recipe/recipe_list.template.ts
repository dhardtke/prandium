// deno-fmt-ignore-file
import { Recipe } from "../../../data/model/recipe.ts";
import { Tag } from "../../../data/model/tag.ts";
import { Pagination } from "../../../data/pagination.ts";
import { date, number } from "../../../data/util/format.ts";
import { parameters } from "../../../http/util/parameters.ts";
import { UrlGenerator } from "../../../http/util/url_generator.ts";
import { l } from "../../../i18n/mod.ts";
import { e, html } from "../../mod.ts";
import { Alert } from "../_components/alert.ts";
import { Breadcrumb } from "../_components/breadcrumb.ts";
import { Icon, LabeledIcon } from "../_components/icon.ts";
import { Pagination as PaginationComponent } from "../_components/pagination.ts";
import { Page } from "../_structure/page.ts";

function TagControls() {
  const currentTagIds = parameters(Page.currentUrl).getAll("tagId");

  return html`
    <div class="col-auto">
      <div class="btn-group">
        <div class="btn-group" role="group">
          <button type="button" class="btn btn-outline-secondary dropdown-toggle" data-bs-toggle="collapse" data-bs-target="#tag-filter">
            ${e(l.navigation.tags)}
          </button>
        </div>
        <a class="btn btn-outline-danger${!currentTagIds.length && " disabled"}"
           href="${e(parameters(Page.currentUrl).remove("tagId", "page"))}"
           title="${e(l.recipe.clearAllTags)}">
          ${Icon("trash")}
        </a>
      </div>
    </div>
  `;
}

function TagFilter(tags: Tag[], showTagFilter: boolean) {
  const currentTagIds = parameters(Page.currentUrl).getAll("tagId");

  return html`
    <div id="tag-filter" class="collapse${showTagFilter && " show"} card mb-3" data-cmp="TagFilter">
      <div class="card-header">
        <div class="input-group">
          <span class="input-group-text">
            ${Icon("funnel")}
          </span>
          <input type="search" class="form-control input-filter" autocomplete="off" title="${e(l.navigation.filterTitle)}"
                 placeholder="${e(l.navigation.filterPlaceholder)}">
        </div>
      </div>
      <div class="card-body overflow-auto">
        <div class="row g-2">
          ${tags.map((tag) => {
            const active = currentTagIds.includes(tag.id + "");
            const disabled = !active && tag.recipeCount === 0;
            let href = active ? parameters(Page.currentUrl).removeSingleValue("tagId", tag.id) : parameters(Page.currentUrl).append("tagId", tag.id);
            href = href.set("tagFilter", "").remove("page");

            return html`
              <div class="col-lg-2 tag${active && " text-white"}">
                <a class="card card-linked p-2${active && " active"}${disabled && " disabled"}" ${!disabled && ` href="${href}"`}>
                  <div class="d-flex justify-content-between">
                    <small class="title${tag.recipeCount === 0 && ` text-muted`}" title="${tag.description}">${tag.title}</small>
                    ${tag.recipeCount! > 0 && html`<span class="badge bg-dark">${tag.recipeCount}</span>`}
                  </div>
                </a>
              </div>
            `;
          })}
        </div>
      </div>
    </div>
  `;
}

function OrderBy() {
  const orderBy = parameters(Page.currentUrl).get("orderBy", "title");

  const options = [
    ["id", l.id],
    ["created_at", l.createdAt],
    ["updated_at", l.updatedAt],
    ["title", l.title],
    ["flagged", l.recipe.flagged],
    ["last_cooked_at", l.recipe.lastCookedAt],
    ["cooked_count", l.recipe.cookedCount],
    ["aggregate_rating_value", l.recipe.aggregateRatingValue],
    ["rating", l.recipe.rating],
    ["prep_time", l.recipe.prepTime],
    ["cook_time", l.recipe.cookTime],
    ["total_time", l.recipe.time.total],
  ];
  const order = parameters(Page.currentUrl).get("order", "ASC")?.toUpperCase();
  const otherOrder = order === "ASC" ? "DESC" : "ASC";
  const otherOrderLabel = otherOrder === "ASC" ? l.orderBy.asc : l.orderBy.desc;

  return html`
    <form class="col" id="orderBy">
      ${[...Page.currentUrl.searchParams.entries()]
        .filter(([name]) => !["orderBy", "order", "flash", "page"].includes(name))
        .map(([name, value]) => html`<input type="hidden" name="${name}" value="${value}">`)}
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
      </div>
    </form>`;
}

const ActionButtons = (recipeCount: number) => html`
  <div class="d-flex justify-content-end">
    <a class="btn btn-primary me-2" href="${UrlGenerator.recipeCreate()}" role="button">
      ${LabeledIcon(l.create, "plus-square", 2)}
    </a>

    <a class="btn btn-success me-2" href="${UrlGenerator.recipeImport()}" role="button">
      ${LabeledIcon(l.recipe.import.title, "cloud-arrow-down-fill", 2)}
    </a>

    <div class="badge bg-secondary">
      <div class="d-flex align-items-center h-100">
        ${e(l.recipe.count(recipeCount))}
      </div>
    </div>
  </div>
`;

export const RecipeListTemplate = (
  recipes: Pagination<Recipe>,
  tags: Tag[],
  showTagFilter: boolean,
  infiniteScrolling: boolean,
) => Page(l.recipes)(html`
  <div class="d-flex align-items-center justify-content-between flex-wrap mb-3">
    ${Breadcrumb(true)}

    ${ActionButtons(recipes.totalItems)}
  </div>

  <div class="row g-3 mb-3">
    <form class="d-flex col-lg-6" action="${UrlGenerator.home()}">
      <div class="input-group">
        <input class="form-control" type="search" name="title" placeholder="${e(l.search)}" title="${e(l.search)}"
               value="${parameters(Page.currentUrl).get("title")}">
        <button class="btn btn-outline-secondary" type="submit">
          ${Icon("search")}
        </button>
      </div>
    </form>

    ${OrderBy()}

    ${TagControls()}
  </div>

  ${TagFilter(tags, showTagFilter)}

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
              <a class="card card-linked h-100${recipe.flagged && ` flagged`}" href="${UrlGenerator.recipe(recipe)}">
                <img src="${UrlGenerator.thumbnail(recipe.thumbnail)}" class="card-img-top" alt="" loading="lazy">
                <div class="card-body">
                  <h5 class="card-title text-clamp">${e(recipe.title)}</h5>
                  <p class="card-text text-clamp">${e(recipe.description)}</p>
                  <p class="card-text">
                    <small class="text-muted" ${recipe.lastCookedAt && `title="${date.format(recipe.lastCookedAt)}"`}>
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

  ${ActionButtons(recipes.totalItems)}
`);
