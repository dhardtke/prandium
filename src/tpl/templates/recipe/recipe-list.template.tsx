/** @jsxImportSource https://esm.sh/preact@10.7.1?pin=v66 */
import { classNames } from "../../../../deps.ts";
import { Recipe } from "../../../data/model/recipe.ts";
import { Tag } from "../../../data/model/tag.ts";
import { Pagination } from "../../../data/pagination.ts";
import { parameters } from "../../../http/util/parameters.ts";
import { UrlGenerator } from "../../../http/util/url-generator.ts";
import { l } from "../../../i18n/mod.ts";
import { date, number } from "../../util/format.ts";
import { Alert } from "../_components/alert.tsx";
import { Breadcrumb } from "../_components/breadcrumb.tsx";
import { Collapsible } from "../_components/collapsible.tsx";
import { Dropdown, DropdownDivider, DropdownItem } from "../_components/dropdown.tsx";
import { Icon, LabeledIcon } from "../_components/icon.tsx";
import { PaginationComponent } from "../_components/pagination.tsx";
import { Page } from "../_structure/page.tsx";

const TagControls = (props: { tags: Tag[]; tagFilterId: string }) => {
  const currentTagIds = parameters(Page.currentUrl).getAll("tagId");

  return (
    <div class="btn-group w-100">
      <div class="btn-group" id="tag-btn">
        <label class={classNames("btn", "secondary", "caret", "right", { disabled: props.tags.length === 0 })} for={props.tagFilterId}>
          {l.navigation.tags}
        </label>
      </div>
      <a
        class={classNames("btn", "danger", { disabled: !currentTagIds.length })}
        href={parameters(Page.currentUrl).remove("tagId", "page").toString()}
        title={l.recipe.clearAllTags}
      >
        <Icon name="trash" />
      </a>
    </div>
  );
};

const TagFilter = (props: { tags: Tag[]; showTagFilter: boolean }) => {
  const currentTagIds = parameters(Page.currentUrl).getAll("tagId");

  return (
    <div id="tag-filter" class={classNames("collapse", "card", "mb", { show: props.showTagFilter })} data-cmp="TagFilter">
      <div class="card-header">
        <div class="input-group">
          <span class="input-group-text">
            <Icon name="funnel" />
          </span>
          <input
            type="search"
            class="form-control input-filter"
            autocomplete="off"
            title={l.navigation.filterTitle}
            placeholder={l.navigation.filterPlaceholder}
          />
        </div>
      </div>
      <div class="card-body">
        <div class="grid">
          {props.tags.map((tag) => {
            const active = currentTagIds.includes(tag.id + "");
            const disabled = !active && tag.recipeCount === 0;
            let href = active ? parameters(Page.currentUrl).removeSingleValue("tagId", tag.id) : parameters(Page.currentUrl).append("tagId", tag.id);
            href = href.set("tagFilter", "").remove("page");

            return (
              <div class="col col-lg-2 tag">
                <a class={classNames("card", "padded", { disabled: disabled, active: active })} href={disabled ? undefined : href.toString()}>
                  <div class="side-by-side">
                    <small class={classNames("title", { "c-muted": tag.recipeCount === 0 })} title={tag.description || undefined}>{tag.title}</small>
                    {tag.recipeCount! > 0 ? <span class="badge">{tag.recipeCount}</span> : ""}
                  </div>
                </a>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

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

  const HiddenInputs = () => (
    <>
      {[...Page.currentUrl.searchParams.entries()]
        .filter(([name]) => !["orderBy", "order", "flash", "page"].includes(name))
        .map(([name, value]) => <input type="hidden" name={name} value={value} />)}
    </>
  );

  return (
    <form id="orderBy">
      <HiddenInputs />
      <div class="input-group">
        <span class="input-group-text">
          {l.orderBy.title}
        </span>
        <select class="form-select" title={l.recipe.orderBy} autocomplete="off" name="orderBy">
          {options.map(([optionValue, optionLabel]) => (
            <option value={optionValue} selected={orderBy === optionValue}>
              {optionLabel}
            </option>
          ))}
        </select>

        <button class="btn secondary" type="submit" name="order" value={otherOrder} title={otherOrderLabel}>
          <Icon name={order === "ASC" ? "arrow-down" : "arrow-up"} />
        </button>
      </div>
    </form>
  );
}

const ActionButtons = (props: { recipeCount: number }) => (
  <div class="action-bar action-bar--right">
    <a class="btn primary" href={UrlGenerator.recipeCreate()}>
      <LabeledIcon label={l.create} name="plus-square" />
    </a>

    <a class="btn secondary" href={UrlGenerator.recipeImport()}>
      <LabeledIcon label={l.recipe.import.title} name="cloud-arrow-down-fill" />
    </a>

    <div class="badge recipe-count">
      {l.recipe.count(props.recipeCount)}
    </div>
  </div>
);

export const RecipeListTemplate = (props: {
  recipes: Pagination<Recipe>;
  tags: Tag[];
  showTagFilter: boolean;
}) => {
  const tagFilterId = "collapsible-tag-filter";

  return (
    <Page title={l.recipes}>
      <div class="side-by-side mb">
        <Breadcrumb />
        <ActionButtons recipeCount={props.recipes.totalItems} />
      </div>

      <div class="grid mb" id="recipe-filter">
        <div class="col-12 col-lg-6">
          <form action={UrlGenerator.home()}>
            <div class="input-group">
              <input class="form-control" type="search" name="title" placeholder={l.search} title={l.search} value={parameters(Page.currentUrl).get("title")} />
              <button class="btn secondary" type="submit">
                <Icon name="search" />
              </button>
            </div>
          </form>
        </div>

        <div class="col-12 col-lg-6">
          <div class="grid">
            <div class="col-12 col-lg-6">
              <OrderBy />
            </div>
            <div class="col-12 col-lg-6">
              <TagControls tags={props.tags} tagFilterId={tagFilterId} />
            </div>
          </div>
        </div>
      </div>

      <Collapsible id={tagFilterId} opened={props.showTagFilter}>
        <TagFilter tags={props.tags} showTagFilter={props.showTagFilter} />
      </Collapsible>

      {"" /* TODO: move card to components function */}
      {Page.currentUrl.searchParams.get("flash") === "deleteSuccessful" && <Alert type="success" title={l.info}>{l.recipe.deleteSuccessful}</Alert>}
      {props.recipes.totalItems
        ? (
          <div class="grid mb" id="recipe-list">
            {props.recipes.items.map((recipe, i) => (
              <div class={classNames("col-12", "col-md-6", "col-lg-4", "recipe", { flagged: recipe.flagged })}>
                <Dropdown id={`dropdown-recipe-${i}`} label={<Icon name="three-dots" />} labelClass={"btn light"}>
                  <DropdownItem>
                    <a href={UrlGenerator.recipeEdit(recipe)}>
                      <LabeledIcon label={l.edit} name="pencil" />
                    </a>
                  </DropdownItem>
                  <DropdownDivider />
                  <DropdownItem>
                    <a class="c-danger" href={UrlGenerator.recipeDelete(recipe)}>
                      <LabeledIcon label={l.delete} name="trash" />
                    </a>
                  </DropdownItem>
                </Dropdown>
                <a class="card" href={UrlGenerator.recipe(recipe)}>
                  <img src={UrlGenerator.thumbnail(recipe.thumbnail)} class="img-responsive" alt="" loading="lazy" />
                  <div class="card-body">
                    <h5 class="card-title text-clamp">{recipe.title}</h5>
                    <p class="text-clamp">{recipe.description}</p>
                    <p>
                      <small class="c-muted" title={recipe.lastCookedAt && date.format(recipe.lastCookedAt)}>
                        {recipe.lastCookedAt ? l.recipe.lastCooked(date.formatRelative(recipe.lastCookedAt)) : l.recipe.notCookedYet}
                      </small>
                    </p>
                  </div>
                  <div class="card-footer">
                    <ul>
                      <li>
                        <ul>
                          <li title={l.recipe.cookedCount}>
                            <LabeledIcon label={recipe.cookedCount?.toString() || "-"} name="bar-chart" />
                          </li>
                          <li title={l.recipe.rating}>
                            <LabeledIcon label={number.format(recipe.rating) || "-"} name="star" />
                          </li>
                          <li title={l.recipe.aggregateRating}>
                            <LabeledIcon label={number.format(recipe.aggregateRatingValue) || "-"} name="people" />
                          </li>
                        </ul>
                      </li>
                      <li title={l.recipe.time.total}>
                        <LabeledIcon label={date.formatMinutes(recipe.totalTime) || "-"} name="clock-fill" />
                      </li>
                    </ul>
                  </div>
                </a>
              </div>
            ))}
          </div>
        )
        : <Alert type="info" title={l.info} className="mb">{l.recipe.noRecipesFound}</Alert>}

      <PaginationComponent pagination={props.recipes} wrapperClass="mb" />

      <ActionButtons recipeCount={props.recipes.totalItems} />
    </Page>
  );
};
