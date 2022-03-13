// deno-fmt-ignore-file
import { Recipe } from "../../../data/model/recipe.ts";
import { Ingredient, ingredient as ingredientHelper } from "../../../data/parse/ingredient/mod.ts";
import { UrlGenerator } from "../../../http/util/url_generator.ts";
import { l } from "../../../i18n/mod.ts";
import { e, html } from "../../mod.ts";
import { date, number } from "../../util/format.ts";
import { Alert } from "../_components/alert.ts";
import { Breadcrumb } from "../_components/breadcrumb.ts";
import { Collapsible } from "../_components/collapsible.ts";
import { Icon, LabeledIcon } from "../_components/icon.ts";
import { Rating } from "../_components/rating.ts";
import { Page } from "../_structure/page.ts";

function NutritionTable(recipe: Recipe): string | undefined {
  const { nutrition } = l.recipe;
  // TODO use Nutrition type
  const fields: (string | undefined)[][] = [
    [nutrition.calories, recipe.nutritionCalories],
    [nutrition.fiber, recipe.nutritionFiber],
    [nutrition.fat, recipe.nutritionFat],
    [nutrition.saturatedFat, recipe.nutritionSaturatedFat],
    [nutrition.unsaturatedFat, recipe.nutritionUnsaturatedFat],
    [nutrition.carbohydrate, recipe.nutritionCarbohydrate],
    [nutrition.sugar, recipe.nutritionSugar],
    [nutrition.protein, recipe.nutritionProtein],
    [nutrition.sodium, recipe.nutritionSodium]
  ].filter(([_, value]) => Boolean(value));
  if (fields.length) {
    return html`
      <div class="col-12 col-lg-6">
        <h5>${l.nutritionalValue}</h5>
        <div class="table-responsive">
          <table class="fw">
            <colgroup>
              <col style="width: 50%"/>
              <col style="width: 50%"/>
            </colgroup>
            ${fields
              .map(([label, value]) => html`
                <tr>
                  <th>${label}</th>
                  <td>${value}</td>
                </tr>
              `)}
          </table>
        </div>
      </div>
    `;
  }
}

function History(recipe: Recipe): string {
  return html`
    <div class="col-12 col-lg-6">
      <h5>${e(l.recipe.history)}</h5>
      ${recipe.history.length ? html`
        <ul class="disc">
          ${recipe.history.map((d) => html`
            <li title="${e(date.format(d))}">${e(date.formatRelative(d))}</li>
          `)}
        </ul>` : html`${e(l.recipe.notCookedYet)}`}
    </div>
  `;
}

function Times(recipe: Recipe): string | undefined {
  return html`
    <div class="col-12 col-lg-6">
      <h5>${l.recipe.form.group.times}</h5>
      ${recipe.prepTime || recipe.cookTime ? html`
        <div class="table-responsive">
          <table class="fw">
            <colgroup>
              <col style="width: 50%"/>
              <col style="width: 50%"/>
            </colgroup>
            ${recipe.prepTime && html`
              <tr>
                <th>${e(l.recipe.time.prep)}</th>
                <td>${e(date.formatMinutes(recipe.prepTime))}</td>
              </tr>`}
            ${recipe.cookTime && html`
              <tr>
                <th>${e(l.recipe.time.cook)}</th>
                <td>${e(date.formatMinutes(recipe.cookTime))}</td>
              </tr>`}
            ${recipe.totalTime && html`
              <tr>
                <th>${e(l.recipe.time.total)}</th>
                <td>${e(date.formatMinutes(recipe.totalTime))}</td>
              </tr>`}
          </table>
        </div>
      ` : html`${e(l.recipe.noTimes)}`}
    </div>
  `;
}

function IngredientQuantity(ingredient: Ingredient): string | undefined {
  if (ingredient.quantity) {
    let text = "";

    if (typeof ingredient.quantity === "number") {
      text += ingredient.quantity;
    } else {
      text += `${ingredient.quantity.from} - ${ingredient.quantity.to}`;
    }

    if (ingredient.unit) {
      text += " " + ingredient.unit;
    }

    return html`<span class="badge">${e(text)}</span>`;
  }
}

function YourRating(recipe: Recipe): string {
  return html`
    <div class="col-12 col-lg-6" id="recipe-rating">
      <div class="side-by-side">
        <h5>${e(l.recipe.rating)}</h5>
        <small class="current c-muted">${e(number.format(recipe.rating, 1))}</small>
      </div>
      ${Rating("rating", recipe.rating)}
    </div>`;
}

function Ingredients(recipe: Recipe, portions?: number): string | undefined {
  if (recipe.ingredients.length) {
    return html`
      <div class="card mb">
        <a class="anchor" id="ingredients"></a>
        <div class="card-header">
          <div class="side-by-side">
            <h5>
              ${e(l.recipe.ingredients.title)}
            </h5>
            <form id="ingredients-form" action="#ingredients">
              <div class="input-group input-group-sm w-auto">
                <input type="number" class="form-control portions" name="portions" value="${e(portions)}" min="1" max="99"
                       title="${e(l.recipe.portions)}">
                <div class="input-group-text">
                  ${e(l.recipe.portions)}
                </div>
                <div class="btn-group">
                  <button class="btn secondary plus" type="button">
                    +
                  </button>
                  <button class="btn secondary minus" type="button">
                    -
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
        <ul class="list-group list-group-flush">
          ${ingredientHelper.parseMany(recipe.ingredients, recipe.yield, portions).map((ingredient) => html`
            <li class="list-group-item">
              <div class="flex">
                <div class="ingredient-quantity">
                  ${ingredient.quantity && IngredientQuantity(ingredient)}
                </div>
                <div>
                  ${e(ingredient.description)}
                </div>
              </div>
            </li>
          `)}
        </ul>
      </div>
    `;
  }
}

function Instructions(recipe: Recipe): string | undefined {
  if (recipe.instructions.length) {
    return html`
      <div class="mb card-set">
        <h3>${e(l.recipe.instructions)}</h3>
        ${recipe.instructions.map((instruction, i) => Collapsible({
            label: e(l.recipe.ingredients.step(i + 1)),
            content: e(instruction),
            opened: true,
            wrapperClass: `card`,
            labelClass: "card-header",
            contentClass: "card-body",
            caret: "right"
          })
        )}
      </div>
    `;
  }
}

function Reviews(recipe: Recipe): string | undefined {
  if (recipe.reviews.length) {
    return html`
      <h3>${e(l.recipe.reviews)}</h3>
      <ul class="dash">
        ${recipe.reviews.map((review, i) => html`
          <li${i < recipe.reviews.length - 1 && ` class="mb"`}>
            <p class="mbo">${e(review.text)}</p>
            <span class="c-muted">${e(date.format(review.date))}</span>
            </li>
        `)}
      </ul>
    `;
  }
}

export const RecipeDetailTemplate = (
  recipe: Recipe,
  portions?: number,
) => Page(recipe.title)(html`
  <div class="side-by-side mb">
    ${Breadcrumb(
      true,
      { title: recipe.title, url: UrlGenerator.recipe(recipe) },
    )}
    <div class="side-by-side">
      ${recipe.source && html`
        <a href="${e(recipe.source)}" target="_blank" class="spacer-r">
          ${LabeledIcon(new URL(recipe.source).hostname, "link-45deg")}
        </a>
      `}
      <div class="side-by-side" title="${e(l.recipe.aggregateRating)}">
        ${Rating("aggregate_rating", recipe.aggregateRatingValue, true, true)}
        <small class="current ml">${e(number.format(recipe.aggregateRatingValue, 2))}</small>
      </div>
    </div>
  </div>

  <div class="side-by-side mb">
    <h1 class="mbo">
      ${recipe.flagged && html`
        <span class="mr">
          ${Icon("flag-fill", "c-info", true)}
        </span>
      `}
      ${e(recipe.title)}
    </h1>
    <div class="action-bar">
      <a href="${UrlGenerator.recipeFlag(recipe)}" class="btn info">
        ${LabeledIcon(recipe.flagged ? l.recipe.unflag : l.recipe.flag, "flag")}
      </a>
      <a href="${UrlGenerator.recipeEdit(recipe)}" class="btn secondary">
        ${LabeledIcon(l.edit, "pencil")}
      </a>
      <a href="${UrlGenerator.recipeDelete(recipe)}" class="btn danger">
        ${LabeledIcon(l.delete, "trash")}
      </a>
    </div>
  </div>
  ${
    Page.currentUrl.searchParams.get("flash") === "editSuccessful"
      ? Alert("success", l.info, l.recipe.editSuccessful)
      : Page.currentUrl.searchParams.get("flash") === "createSuccessful" &&
      Alert("success", l.info, l.recipe.createSuccessful)
  }

  ${recipe.tags.length && html`
    <div class="flex">
      ${recipe.tags.map((tag, i) => html`
        <a${tag.description && ` title="${e(tag.description)}"`} href="${e(UrlGenerator.home({ tagIds: [tag.id!], tagFilter: true }))}"
                                                                 class="badge mb${i < recipe.tags.length - 1 && " mr"}">
          ${e(tag.title)}
          </a>`)}
    </div>
  `}

  <div class="grid">
    ${NutritionTable(recipe)}
    ${History(recipe)}
    ${Times(recipe)}
    ${YourRating(recipe)}
  </div>

  ${recipe.description && html`<p class="lead">${e(recipe.description)}</p>`}

  ${/*TODO show metadata like last cooked, etc.?*/""}

  ${recipe.thumbnail && html`
    <div class="mb">
      <img class="img-thumbnail" src="${UrlGenerator.thumbnail(recipe.thumbnail)}" alt="" loading="lazy">
    </div>
  `}

  ${Ingredients(recipe, portions)}
  ${Instructions(recipe)}
  ${Reviews(recipe)}
`);
