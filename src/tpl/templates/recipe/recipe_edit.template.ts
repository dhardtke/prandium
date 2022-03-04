// deno-fmt-ignore-file
import { Recipe } from "../../../data/model/recipe.ts";
import { UrlGenerator } from "../../../http/util/url_generator.ts";
import { l } from "../../../i18n/mod.ts";
import { e, html } from "../../mod.ts";
import { Alert } from "../_components/alert.ts";
import { Breadcrumb } from "../_components/breadcrumb.ts";
import { Icon, LabeledIcon } from "../_components/icon.ts";
import { Page } from "../_structure/page.ts";

const arrayFieldTextarea = (name: string, item?: string) =>
  html`<textarea class="me" title="" name="${e(name)}" required>${e(item)}</textarea>`;

const arrayFieldTextInput = (name: string, item?: string) =>
  html`<input class="me" title="" name="${e(name)}" required value="${e(item)}">`;

const arrayFieldDateTimeInput = (name: string, item?: Date) =>
  html`
    <div class="datetime">
      <input type="date" name="${e(name)}" required value="${(item || new Date()).toLocaleDateString("en-CA")}"
             step="any"/>
      <input type="time" name="${e(name)}" required value="${item && item.toLocaleTimeString("en-GB")}" step="any"/>
    </div>`;

function arrayField<T>(
  title: string,
  createBtnLabel: string,
  name: string,
  renderer: (name: string, item?: T) => string,
  array: T[] = [],
  moveControls = true
) {
  const renderItem = (item?: T, i = -1, last = false) => html`
    <li class="list-group-item">
      <div class="grid" style="grid-template-columns: 1fr auto; --gap: .5rem">
        ${renderer(name, item)}

        <div class="flex">
          ${moveControls && html`
            <div class="btn-group mr">
              <button type="button" data-hook="up" class="btn sm secondary" title="${e(l.up)}" ${!i && "disabled"}>
                ${Icon("arrow-up")}
              </button>
              <button type="button" data-hook="down" class="btn sm secondary" title="${e(l.down)}" ${last && "disabled"}>
                ${Icon("arrow-down")}
              </button>
            </div>
          `}
          <button type="button" data-hook="delete" class="btn sm danger" title="${e(l.delete)}">
            ${Icon("trash")}
          </button>
        </div>
      </div>
    </li>
  `;

  return html`
    <div class="card mb array-field">
      <div class="card-header">
        ${e(title)}
      </div>
      <ul class="list-group list-group-flush">
        ${array.map((item, i) => renderItem(item, i, i === array.length - 1))}
        <template>
          ${renderItem()}
        </template>
      </ul>
      <div class="card-footer">
        <button type="button" class="btn sm primary" data-hook="create">
          ${LabeledIcon(createBtnLabel, "plus-square")}
        </button>
      </div>
    </div>
  `;
}

export const RecipeEditTemplate = (recipe?: Recipe) =>
  Page(recipe ? recipe.title : l.create)(html`
    ${Breadcrumb(
      false,
      ...recipe ? [
        { title: recipe.title, url: UrlGenerator.recipe(recipe) },
        { title: l.edit, url: UrlGenerator.recipeEdit(recipe) },
      ] : [
        { title: l.create, url: UrlGenerator.recipeCreate() },
      ],
    )}

    <form method="POST" autocomplete="off" enctype="multipart/form-data" id="edit-form">
      <div class="grid">
        <div class="col-lg-6 mb">
          <div class="card h-100">
            <div class="card-header">
              ${e(l.recipe.form.group.basic)}
            </div>
            <div class="card-body">
              <div class="mb">
                <label for="title">
                  ${e(l.title)} *
                </label>
                <input id="title" name="title" required value="${e(recipe?.title ?? "")}">
              </div>
              <div class="mb">
                <label for="description">
                  ${e(l.description)}
                </label>
                <textarea id="description" name="description">${e(recipe?.description ?? "")}</textarea>
              </div>
              <div class="mb">
                <label for="source">
                  ${e(l.recipe.source)}
                </label>
                <input id="source" name="source" value="${e(recipe?.source ?? "")}">
              </div>
              <div>
                <label for="yield">
                  ${e(l.recipe.yield)}
                </label>
                <input type="number" min="1" id="yield" name="yield" value="${e(recipe?.yield ?? "")}">
              </div>
            </div>
          </div>
        </div>
        <div class="col-lg-6 mb">
          <div class="card h-100" id="image-picker">
            <img class="img-responsive" src="${e(UrlGenerator.thumbnail(recipe?.thumbnail ?? ""))}" alt="" loading="lazy">
            <div class="card-body hidden">
              <input class="hidden" type="file" accept="image/*" name="thumbnail">
              <input type="hidden" name="deleteThumbnail" disabled>
              ${Alert("danger", l.error.title, l.recipe.form.imageError, "mb-0 mt-3")}
            </div>
            <div class="card-footer">
              <div class="d-flex justify-content-between flex-wrap align-items-center">
                <small class="c-muted">
                  ${e(l.recipe.form.thumbnailHint)}
                </small>
                <button type="button" ${!recipe || !recipe.thumbnail ? " disabled" : ""} class="btn sm danger"
                        title="${e(l.recipe.form.deleteThumbnail)}" data-hook="delete">
                  ${Icon("trash")}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="card mb">
        <div class="card-header">
          ${e(l.recipe.form.group.nutrition)}
        </div>
        <div class="card-body">
          <div class="grid gy-3">
            <div class="col-lg-2">
              <label for="nutritionCalories">
                ${e(l.recipe.nutrition.calories)}
              </label>
              <input id="nutritionCalories" name="nutritionCalories" value="${e(recipe?.nutritionCalories ?? "")}">
            </div>
            <div class="col-lg-2">
              <label for="nutritionCarbohydrate">
                ${e(l.recipe.nutrition.carbohydrate)}
              </label>
              <input id="nutritionCarbohydrate" name="nutritionCarbohydrate" value="${e(recipe?.nutritionCarbohydrate ?? "")}">
            </div>
            <div class="col-lg-2">
              <label for="nutritionCholesterol">
                ${e(l.recipe.nutrition.cholesterol)}
              </label>
              <input id="nutritionCholesterol" name="nutritionCholesterol" value="${e(recipe?.nutritionCholesterol ?? "")}">
            </div>
            <div class="col-lg-2">
              <label for="nutritionFat">
                ${e(l.recipe.nutrition.fat)}
              </label>
              <input id="nutritionFat" name="nutritionFat" value="${e(recipe?.nutritionFat ?? "")}">
            </div>
            <div class="col-lg-2">
              <label for="nutritionFiber">
                ${e(l.recipe.nutrition.fiber)}
              </label>
              <input id="nutritionFiber" name="nutritionFiber" value="${e(recipe?.nutritionFiber ?? "")}">
            </div>
            <div class="col-lg-2">
              <label for="nutritionProtein">
                ${e(l.recipe.nutrition.protein)}
              </label>
              <input id="nutritionProtein" name="nutritionProtein" value="${e(recipe?.nutritionProtein ?? "")}">
            </div>
            <div class="col-lg-2">
              <label for="nutritionSaturatedFat">
                ${e(l.recipe.nutrition.saturatedFat)}
              </label>
              <input id="nutritionSaturatedFat" name="nutritionSaturatedFat" value="${e(recipe?.nutritionSaturatedFat ?? "")}">
            </div>
            <div class="col-lg-2">
              <label for="nutritionSodium">
                ${e(l.recipe.nutrition.sodium)}
              </label>
              <input id="nutritionSodium" name="nutritionSodium" value="${e(recipe?.nutritionSodium ?? "")}">
            </div>
            <div class="col-lg-2">
              <label for="nutritionSugar">
                ${e(l.recipe.nutrition.sugar)}
              </label>
              <input id="nutritionSugar" name="nutritionSugar" value="${e(recipe?.nutritionSugar ?? "")}">
            </div>
            <div class="col-lg-2">
              <label for="nutritionTransFat">
                ${e(l.recipe.nutrition.transFat)}
              </label>
              <input id="nutritionTransFat" name="nutritionTransFat" value="${e(recipe?.nutritionTransFat ?? "")}">
            </div>
            <div class="col-lg-2">
              <label for="nutritionUnsaturatedFat">
                ${e(l.recipe.nutrition.unsaturatedFat)}
              </label>
              <input id="nutritionUnsaturatedFat" name="nutritionUnsaturatedFat"
                     value="${e(recipe?.nutritionUnsaturatedFat ?? "")}">
            </div>
          </div>
        </div>
      </div>

      <div class="card mb">
        <div class="card-header">
          ${e(l.recipe.form.group.times)}
        </div>
        <div class="card-body">
        ${/*TODO use different widget */""}
          <div class="grid" style="grid-template-columns: minmax(0, 1fr) minmax(0, 1fr)">
            <div class="col-sm">
              <label for="prepTime">
                ${e(l.recipe.prepTime)}
              </label>
              <input type="number" min="0" id="prepTime" name="prepTime" value="${e(recipe?.prepTime ?? "")}">
              <div class="form-text">
                ${e(l.recipe.form.timeHint)}
              </div>
            </div>
            <div class="col-sm">
              <label for="cookTime">
                ${e(l.recipe.cookTime)}
              </label>
              <input type="number" min="0" id="cookTime" name="cookTime" value="${e(recipe?.cookTime ?? "")}">
              <div class="form-text">
                ${e(l.recipe.form.timeHint)}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="card mb">
        <div class="card-header">
          ${e(l.recipe.form.group.ratings)}
        </div>
        <div class="card-body">
          <div class="grid" style="grid-template-columns: 1fr 1fr 1fr;">
            <div class="col-sm">
              <label for="aggregateRatingValue">
                ${e(l.recipe.aggregateRatingValue)}
              </label>
              <input type="number" min="0" step=".01" id="aggregateRatingValue" name="aggregateRatingValue"
                     value="${e(recipe?.aggregateRatingValue ?? "")}">
            </div>

            <div class="col-sm">
              <label for="aggregateRatingCount">
                ${e(l.recipe.aggregateRatingCount)}
              </label>
              <input type="number" min="0" id="aggregateRatingCount" name="aggregateRatingCount"
                     value="${e(recipe?.aggregateRatingCount ?? "")}">
            </div>
            <div class="col-sm">
              <label for="rating">
                ${e(l.recipe.rating)}
              </label>
              <input type="number" min="0" max="5" step=".5" id="rating" name="rating" value="${e(recipe?.rating ?? "")}">
            </div>
          </div>
        </div>
      </div>

      ${arrayField(l.recipe.history, l.recipe.form.addHistoryEntry, "history", arrayFieldDateTimeInput, recipe?.history, false)}

      ${arrayField(l.recipe.ingredients.title, l.recipe.form.createIngredient, "ingredients", arrayFieldTextInput, recipe?.ingredients)}
      ${arrayField(l.recipe.instructions, l.recipe.form.createInstruction, "instructions", arrayFieldTextarea, recipe?.instructions)}
    ${/*TODO edit tags, reviews, history, etc. -->*/""}

      <a class="btn danger mr" href="${recipe ? UrlGenerator.recipe(recipe) : UrlGenerator.home()}">
        ${LabeledIcon(l.cancel, "arrow-left")}
      </a>
      <button type="submit" class="btn primary">
        ${LabeledIcon(l.save, "check-square-fill")}
      </button>
    </form>
  `);
