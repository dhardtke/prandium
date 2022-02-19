// deno-fmt-ignore-file
import { Recipe } from "../../../data/model/recipe.ts";
import { Tag } from "../../../data/model/tag.ts";
import { Pagination } from "../../../data/pagination.ts";
import { parameters } from "../../../http/util/parameters.ts";
import { UrlGenerator } from "../../../http/util/url_generator.ts";
import { l } from "../../../i18n/mod.ts";
import { e, html } from "../../mod.ts";
import { date, number } from "../../util/format.ts";
import { Alert } from "../_components/alert.ts";
import { Breadcrumb } from "../_components/breadcrumb.ts";
import { Collapsible, CollapsibleHtml } from "../_components/collapsible.ts";
import { DIVIDER, Dropdown } from "../_components/dropdown.ts";
import { Icon, LabeledIcon } from "../_components/icon.ts";
import { Pagination as PaginationComponent } from "../_components/pagination.ts";
import { Page } from "../_structure/page.ts";

function TagControls(tags: Tag[], tagFilter: CollapsibleHtml) {
  const currentTagIds = parameters(Page.currentUrl).getAll("tagId");

  return html`
    <div class="col-6 col-lg-2">
      <div class="btn-group">
        <div class="btn-group">
          <label class="btn secondary caret right${tags.length === 0 && " disabled"}" for="${tagFilter.labelId}">
            ${e(l.navigation.tags)}
          </label>
        </div>
        <a class="btn danger${!currentTagIds.length && " disabled"}"
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
      <div class="card-body">
        <div class="grid">
          ${tags.map((tag) => {
            const active = currentTagIds.includes(tag.id + "");
            const disabled = !active && tag.recipeCount === 0;
            let href = active ? parameters(Page.currentUrl).removeSingleValue("tagId", tag.id) : parameters(Page.currentUrl).append("tagId", tag.id);
            href = href.set("tagFilter", "").remove("page");

            return html`
              <div class="col col-lg-2 tag">
                <a class="card padded${disabled && " disabled"}${active && " active"}" ${!disabled && ` href="${href}"`}>
                  <div class="side-by-side">
                    <small class="title${tag.recipeCount === 0 && ` text-muted`}" title="${tag.description}">${tag.title}</small>
                    ${tag.recipeCount! > 0 && html`<span class="badge">${tag.recipeCount}</span>`}
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
    <form class="col-6 col-lg-4" id="orderBy">
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

        <button class="btn secondary" type="submit" name="order" value="${otherOrder}"
                title="${otherOrderLabel}">
          ${Icon(order === "ASC" ? "arrow-down" : "arrow-up")}
        </button>
      </div>
    </form>`;
}

const ActionButtons = (recipeCount: number) => html`
  <div class="action-bar action-bar--right">
    <a class="btn primary" href="${UrlGenerator.recipeCreate()}">
      ${LabeledIcon(l.create, "plus-square")}
    </a>

    <a class="btn secondary" href="${UrlGenerator.recipeImport()}">
      ${LabeledIcon(l.recipe.import.title, "cloud-arrow-down-fill")}
    </a>

    <div class="badge">
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
) => {
  const tagFilter = Collapsible({
    content: html`${TagFilter(tags, showTagFilter)}`,
    opened: showTagFilter
  });

  return Page(l.recipes)(html`
    <div class="side-by-side mb">
      ${Breadcrumb()}

      ${ActionButtons(recipes.totalItems)}
    </div>

    <div class="grid mb" id="recipe-filter">
      <form class="col-12 col-lg-6" action="${UrlGenerator.home()}">
        <div class="input-group">
          <input class="form-control" type="search" name="title" placeholder="${e(l.search)}" title="${e(l.search)}"
                 value="${parameters(Page.currentUrl).get("title")}">
          <button class="btn secondary" type="submit">
            ${Icon("search")}
          </button>
        </div>
      </form>

      ${OrderBy()}

      ${TagControls(tags, tagFilter)}
    </div>

    ${tagFilter}

    ${""/* TODO: move card to components function */}
    ${Page.currentUrl.searchParams.get("flash") === "deleteSuccessful" && Alert("success", l.info, l.recipe.deleteSuccessful)}
    ${recipes.totalItems
      ? html`
        <div class="grid mb" id="recipe-list">
          ${recipes.items.map((recipe) => html`
            <div class="col-12 col-md-6 col-lg-4 recipe${recipe.flagged && ` flagged`}">
              ${Dropdown({
                label: Icon("three-dots"),
                labelClass: "btn light",
                items: [
                  {
                    html: html`<a href="${UrlGenerator.recipeEdit(recipe)}">
                      ${LabeledIcon(l.edit, "pencil")}
                    </a>`
                  },
                  DIVIDER,
                  {
                    html: html`<a class="text-danger" href="${UrlGenerator.recipeDelete(recipe)}">
                      ${LabeledIcon(l.delete, "trash")}
                    </a>`
                  }
                ]
              })}
              <a class="card" href="${UrlGenerator.recipe(recipe)}">
                <img src="${UrlGenerator.thumbnail(recipe.thumbnail)}" class="img-responsive" alt="" loading="lazy">
                <div class="card-body">
                  <h5 class="card-title text-clamp">${e(recipe.title)}</h5>
                  <p class="text-clamp">${e(recipe.description)}</p>
                  <p>
                    <small class="text-muted" ${recipe.lastCookedAt && `title="${date.format(recipe.lastCookedAt)}"`}>
                      ${
                        recipe.lastCookedAt
                          ? e(l.recipe.lastCooked(date.formatRelative(recipe.lastCookedAt)))
                          : e(l.recipe.notCookedYet)
                      }
                    </small>
                  </p>
                </div>
                <div class="card-footer">
                  <ul>
                    <li>
                      <ul>
                        <li title="${e(l.recipe.cookedCount)}">
                          ${LabeledIcon(recipe.cookedCount || "-", "bar-chart")}
                        </li>
                        <li title="${e(l.recipe.rating)}">
                          ${LabeledIcon(number.format(recipe.rating) || "-", "star")}
                        </li>
                        <li title="${e(l.recipe.aggregateRating)}">
                          ${LabeledIcon(number.format(recipe.aggregateRatingValue) || "-", "people")}
                        </li>
                      </ul>
                    </li>
                    <li title="${e(l.recipe.time.total)}">
                      ${LabeledIcon(date.formatSeconds(recipe.totalTime) || "-", "clock-fill")}
                    </li>
                  </ul>
                </div>
              </a>
            </div>
          `)}
        </div>
      ` : Alert("info", l.info, l.recipe.noRecipesFound, "mb")
    }

    ${PaginationComponent(recipes, "mb")}

    ${ActionButtons(recipes.totalItems)}
  `);
};
