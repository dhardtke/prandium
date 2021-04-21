import { Recipe } from "../../../data/model/recipe.ts";
import { date, number } from "../../../data/util/format.ts";
import { ingredient as ingredientHelper } from "../../../data/util/ingredient.ts";
import { UrlGenerator } from "../../../http/util/url_generator.ts";
import { e, html } from "../../mod.ts";
import { t } from "../../util/translation.ts";
import { Alert } from "../_components/alert.ts";
import { Breadcrumb } from "../_components/breadcrumb.ts";
import { Icon, LabeledIcon } from "../_components/icon.ts";
import { Rating } from "../_components/rating.ts";
import { PageTemplate } from "../_structure/page.template.ts";

export const RecipeDetailTemplate = (
  recipe: Recipe,
  currentUrl: URL,
  portions?: number,
) =>
  PageTemplate(recipe.title)(html`
  ${
    Breadcrumb(
      false,
      { title: t("recipes"), url: UrlGenerator.recipeList() },
      { title: recipe.title, url: UrlGenerator.recipe(recipe) },
    )
  }

  <div class="d-flex justify-content-between align-items-center flex-wrap mb-3">
    <h1 class="mb-0">${e(recipe.title)}</h1>
    <div class="d-flex pt-2">
      <a href="${
    UrlGenerator.recipeEdit(recipe)
  }" class="btn btn-secondary btn-sm me-2">
        ${LabeledIcon(t("edit"), "pencil")}
      </a>
      <a href="${
    UrlGenerator.recipeDelete(recipe)
  }" class="btn btn-danger btn-sm">
        ${LabeledIcon(t("delete"), "trash")}
      </a>
    </div>
  </div>
  ${
    currentUrl.searchParams.get("flash") === "editSuccessful"
      ? Alert("success", t("info"), t("recipe.edit_successful"))
      : currentUrl.searchParams.get("flash") === "createSuccessful" &&
        Alert("success", t("info"), t("recipe.create_successful"))
  }

  ${recipe.tags.length && html`
    <div class="d-flex flex-wrap">
      ${
    recipe.tags.map((tag, i) =>
      html`
            <a title="${e(tag.description)}" href="${
        e(
          UrlGenerator.recipeList({ tagIds: [tag.id!] }),
        )
      }"
               class="badge badge-linked bg-dark mb-3${i <
          recipe.tags.length - 1 &&
        " me-1"}">
              ${e(tag.title)}
            </a>
          `
    )
  }
    </div>
  `}

  <div class="d-flex flex-wrap">
    ${recipe.nutritionCalories && html`
      <span class="badge bg-dark mb-3 me-1">
          <span class="d-flex align-items-center">
            ${LabeledIcon(recipe.nutritionCalories, "battery-half")}
          </span>
        </span>
      <!-- TODO print other nutritional info -->
    `}

    ${recipe.prepTime && html`
      <span class="badge bg-dark mb-3 me-1">
            <span class="d-flex align-items-center">
                <span class="me-1">${Icon("layout-wtf")}</span>
                <span class="me-1">${e(t("recipe.time.prep"))}</span>${
    e(
      date.formatSeconds(recipe.prepTime),
    )
  }
            </span>
        </span>
    `}

    ${recipe.cookTime && html`
      <span class="badge bg-dark mb-3 me-1">
            <span class="d-flex align-items-center">
                <span class="me-1">${Icon("alarm")}</span>
                <span class="me-1">${e(t("recipe.time.cook"))}</span>${
    e(
      date.formatSeconds(recipe.cookTime),
    )
  }
            </span>
        </span>
    `}

    ${recipe.prepTime && recipe.cookTime && html`
      <span class="badge bg-dark mb-3 me-1">
            <span class="d-flex align-items-center">
                <span class="me-1">${Icon("clock-fill")}</span>
                <span class="me-1">${e(t("recipe.time.total"))}</span>
                ${e(date.formatSeconds(recipe.prepTime + recipe.cookTime))}
            </span>
        </span>
    `}

    ${recipe.source && html`
      <a href="${
    e(recipe.source)
  }" target="_blank" class="badge badge-linked bg-dark mb-3 me-1">
        <div class="d-flex align-items-center">
          ${LabeledIcon(new URL(recipe.source).hostname, "link-45deg")}
        </div>
      </a>
    `}
  </div>

  ${recipe.description && html`<p class="lead">${e(recipe.description)}</p>`}

  <div class="row">
    <div class="col-sm mb-3">
      <div class="card">
        <div class="card-body d-flex align-items-center" id="recipe-rating">
          <span class="text-muted me-auto">${e(t("recipe.rating"))}</span>
          ${Rating(recipe.rating)}
          <small class="current ms-1">${
    e(number.format(recipe.rating, 1))
  }</small>
        </div>
      </div>
    </div>

    <div class="col-sm mb-3">
      <div class="card">
        <div class="card-body d-flex align-items-center">
          <span class="text-muted me-auto">${
    e(t("recipe.aggregate_rating"))
  }</span>
          ${Rating(recipe.aggregateRatingValue, true)}
          <small class="current ms-1">${
    e(number.format(recipe.aggregateRatingValue, 2))
  }</small>
        </div>
      </div>
    </div>
  </div>

  ${
    recipe.history.map((d) =>
      html`
        <div>${e(date.format(d))}</div>`
    )
  }

  <!-- TODO show metadata like last cooked, etc.? -->

  ${recipe.thumbnail && html`
    <div>
      <img class="img-thumbnail" src="${
    UrlGenerator.thumbnail(recipe.thumbnail)
  }" alt="" loading="lazy">
    </div>
  `}

  ${recipe.ingredients.length && html`
    <div class="card mt-3">
      <a class="anchor" id="ingredients"></a>
      <div class="card-header">
        <div class="d-flex align-items-center justify-content-between">
          <h2 class="h5 mb-0">
            ${e(t("recipe.ingredients.title"))}
          </h2>
          <form class="d-flex" method="get" id="ingredients-form" action="#ingredients">
            <div class="input-group input-group-sm w-auto">
              <input type="number" class="form-control portions" name="portions" value="${
    e(portions)
  }" min="1" max="99"
                     title="${e(t("recipe.portions"))}">
              <div class="input-group-text">
                ${e(t("recipe.portions"))}
              </div>
              <button class="btn btn-sm btn-outline-secondary d-flex justify-content-center plus" type="button">
                +
              </button>
              <button class="btn btn-sm btn-outline-secondary d-flex justify-content-center minus" type="button">
                -
              </button>
            </div>
          </form>
        </div>
      </div>
      <ul class="list-group list-group-flush">
        ${
    ingredientHelper.parseMany(recipe.ingredients, recipe.yield, portions).map((
      ingredient,
    ) =>
      html`
                <li class="list-group-item">
                  <div class="d-flex align-items-center">
                    <div class="text-center ingredient-amount">
                      ${ingredient.amount &&
        html`<span class="badge bg-dark">${e(ingredient.amount)}</span>`}
                    </div>
                    <div>
                      ${e(ingredient.description)}
                    </div>
                  </div>
                </li>
              `
    )
  }
      </ul>
    </div>
  `}

  ${recipe.instructions.length && html`
    <h3 class="mt-3">
      ${e(t("recipe.instructions"))}
    </h3>
    <div class="accordion">
      ${
    recipe.instructions.map((instruction, i) =>
      html`
            <div class="accordion-item">
              <h2 class="accordion-header" id="heading-instruction-${i}">
                <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#collapse-instruction-${i}">
                  ${e(t("recipe.ingredients.step", { step: i + 1 }))}
                </button>
              </h2>
              <div id="collapse-instruction-${i}" class="accordion-collapse collapse show">
                <div class="accordion-body">
                  ${e(instruction)}
                </div>
              </div>
            </div>
          `
    )
  }
    </div>
  `}

  ${recipe.reviews.length && html`
    <h3 class="mt-3">${e(t("recipe.reviews"))}</h3>
    ${
    recipe.reviews.map((review, i) =>
      html`
          <figure${i < recipe.reviews.length - 1 && ' class="mb-0"'}>
            <blockquote class="blockquote">
              <p>${e(review.text)}</p>
            </blockquote>
            <figcaption class="blockquote-footer mb-0">
              ${e(date.format(review.date))}
            </figcaption>
            </figure>
        `
    )
  }
  `}
`);
