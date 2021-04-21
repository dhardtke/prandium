import { Recipe } from "../../../data/model/recipe.ts";
import { UrlGenerator } from "../../../http/util/url_generator.ts";
import { e, html } from "../../mod.ts";
import { t } from "../../util/translation.ts";
import { Alert } from "../_components/alert.ts";
import { Breadcrumb } from "../_components/breadcrumb.ts";
import { Icon, LabeledIcon } from "../_components/icon.ts";
import { Page } from "../_structure/page.ts";

function arrayField(
  title: string,
  createBtnLabel: string,
  name: string,
  textarea: boolean,
  array: string[] = [],
) {
  const renderItem = (item = "", i = -1, last = false) =>
    html`
      <li class="list-group-item">
        <div class="row gy-3">
          <div class="col-sm-auto flex-grow-1">
            ${
      textarea
        ? html`<textarea class="form-control me-2" title="" name="${
          e(name)
        }" required>${e(item)}</textarea>`
        : html`<input class="form-control me-2" title="" name="${
          e(name)
        }" required value="${e(item)}`
    }
          </div>

          <div class="col-sm-auto d-flex align-items-center">
            <div class="d-flex border-end me-2 pe-2">
              <button type="button" data-hook="up" class="btn btn-sm btn-outline-secondary me-1" title="${
      e(t("up"))
    }" ${!i && "disabled"}>
                ${Icon("arrow-up")}
              </button>
              <button type="button" data-hook="down" class="btn btn-sm btn-outline-secondary" title="${
      e(t("down"))
    }" ${last && "disabled"}>
                ${Icon("arrow-down")}
              </button>
            </div>
            <button type="button" data-hook="delete" class="btn btn-sm btn-outline-danger me-1" title="${
      e(t("delete"))
    }">
              ${Icon("trash")}
            </button>
          </div>
        </div>
      </li>
    `;

  return html`
    <div class="card mb-3 array-field">
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
        <button type="button" class="btn btn-sm btn-outline-primary" data-hook="create">
          ${LabeledIcon(createBtnLabel, "plus-square", 2)}
        </button>
      </div>
    </div>
  `;
}

export const RecipeEditTemplate = (recipe?: Recipe) =>
  Page(recipe ? recipe.title : t("create"))(html`
  ${
    Breadcrumb(
      false,
      { title: t("recipes"), url: UrlGenerator.recipeList() },
      ...recipe
        ? [
          { title: recipe.title, url: UrlGenerator.recipe(recipe) },
          { title: t("edit"), url: UrlGenerator.recipeEdit(recipe) },
        ]
        : [
          { title: t("create"), url: UrlGenerator.recipeCreate() },
        ],
    )
  }

  <form method="POST" autocomplete="off" enctype="multipart/form-data" id="edit-form">
    <div class="row">
      <div class="col-lg-6 mb-3">
        <div class="card h-100">
          <div class="card-header">
            ${e(t("recipe.form.group.basic"))}
          </div>
          <div class="card-body">
            <div class="mb-3">
              <label for="title" class="form-label">
                ${e(t("title"))} *
              </label>
              <input class="form-control" id="title" name="title" required value="${
    e(recipe?.title ?? "")
  }">
            </div>
            <div class="mb-3">
              <label for="description" class="form-label">
                ${e(t("description"))}
              </label>
              <textarea class="form-control" id="description" name="description">${
    e(recipe?.description ?? "")
  }</textarea>
            </div>
            <div class="mb-3">
              <label for="source" class="form-label">
                ${e(t("recipe.source"))}
              </label>
              <input class="form-control" id="source" name="source" value="${
    e(recipe?.source ?? "")
  }">
            </div>
            <div>
              <label for="yield" class="form-label">
                ${e(t("recipe.yield"))}
              </label>
              <input type="number" min="1" class="form-control" id="yield" name="yield" value="${
    e(recipe?.yield ?? "")
  }">
            </div>
          </div>
        </div>
      </div>
      <div class="col-lg-6 mb-3">
        <div class="card h-100" id="image-picker">
          <img class="card-img-top" src="${
    e(UrlGenerator.thumbnail(recipe?.thumbnail ?? ""))
  }" alt="" loading="lazy">
          <div class="card-body d-none">
            <input class="d-none" type="file" accept="image/*" name="thumbnail">
            <input type="hidden" name="deleteThumbnail" disabled>
            ${
    Alert("danger", t("error.title"), t("recipe.form.image_error"), "mb-0 mt-3")
  }
          </div>
          <div class="card-footer mt-auto">
            <div class="d-flex justify-content-between flex-wrap align-items-center">
              <small class="text-muted">
                ${e(t("recipe.form.thumbnail_hint"))}
              </small>
              <button type="button" ${
    !recipe || !recipe.thumbnail ? " disabled" : ""
  } class="btn btn-sm btn-danger"
                      title="${
    e(t("recipe.form.delete_thumbnail"))
  }" data-hook="delete">
                ${Icon("trash")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="card mb-3">
      <div class="card-header">
        ${e(t("recipe.form.group.nutrition"))}
      </div>
      <div class="card-body">
        <div class="row gy-3">
          <div class="col-lg-2">
            <label for="nutritionCalories" class="form-label">
              ${e(t("recipe.nutrition.calories"))}
            </label>
            <input class="form-control" id="nutritionCalories" name="nutritionCalories" value="${
    e(
      recipe
        ?.nutritionCalories ?? "",
    )
  }">
          </div>
          <div class="col-lg-2">
            <label for="nutritionCarbohydrate" class="form-label">
              ${e(t("recipe.nutrition.carbohydrate"))}
            </label>
            <input class="form-control" id="nutritionCarbohydrate" name="nutritionCarbohydrate" value="${
    e(
      recipe
        ?.nutritionCarbohydrate ?? "",
    )
  }">
          </div>
          <div class="col-lg-2">
            <label for="nutritionCholesterol" class="form-label">
              ${e(t("recipe.nutrition.cholesterol"))}
            </label>
            <input class="form-control" id="nutritionCholesterol" name="nutritionCholesterol" value="${
    e(
      recipe
        ?.nutritionCholesterol ?? "",
    )
  }">
          </div>
          <div class="col-lg-2">
            <label for="nutritionFat" class="form-label">
              ${e(t("recipe.nutrition.fat"))}
            </label>
            <input class="form-control" id="nutritionFat" name="nutritionFat" value="${
    e(
      recipe
        ?.nutritionFat ?? "",
    )
  }">
          </div>
          <div class="col-lg-2">
            <label for="nutritionFiber" class="form-label">
              ${e(t("recipe.nutrition.fiber"))}
            </label>
            <input class="form-control" id="nutritionFiber" name="nutritionFiber" value="${
    e(
      recipe
        ?.nutritionFiber ?? "",
    )
  }">
          </div>
          <div class="col-lg-2">
            <label for="nutritionProtein" class="form-label">
              ${e(t("recipe.nutrition.protein"))}
            </label>
            <input class="form-control" id="nutritionProtein" name="nutritionProtein" value="${
    e(
      recipe
        ?.nutritionProtein ?? "",
    )
  }">
          </div>
          <div class="col-lg-2">
            <label for="nutritionSaturatedFat" class="form-label">
              ${e(t("recipe.nutrition.saturated_fat"))}
            </label>
            <input class="form-control" id="nutritionSaturatedFat" name="nutritionSaturatedFat" value="${
    e(
      recipe
        ?.nutritionSaturatedFat ?? "",
    )
  }">
          </div>
          <div class="col-lg-2">
            <label for="nutritionSodium" class="form-label">
              ${e(t("recipe.nutrition.sodium"))}
            </label>
            <input class="form-control" id="nutritionSodium" name="nutritionSodium" value="${
    e(
      recipe
        ?.nutritionSodium ?? "",
    )
  }">
          </div>
          <div class="col-lg-2">
            <label for="nutritionSugar" class="form-label">
              ${e(t("recipe.nutrition.sugar"))}
            </label>
            <input class="form-control" id="nutritionSugar" name="nutritionSugar" value="${
    e(
      recipe
        ?.nutritionSugar ?? "",
    )
  }">
          </div>
          <div class="col-lg-2">
            <label for="nutritionTransFat" class="form-label">
              ${e(t("recipe.nutrition.trans_fat"))}
            </label>
            <input class="form-control" id="nutritionTransFat" name="nutritionTransFat" value="${
    e(
      recipe
        ?.nutritionTransFat ?? "",
    )
  }">
          </div>
          <div class="col-lg-2">
            <label for="nutritionUnsaturatedFat" class="form-label">
              ${e(t("recipe.nutrition.unsaturated_fat"))}
            </label>
            <input class="form-control" id="nutritionUnsaturatedFat" name="nutritionUnsaturatedFat"
                   value="${e(recipe?.nutritionUnsaturatedFat ?? "")}">
          </div>
        </div>
      </div>
    </div>

    <div class="card mb-3">
      <div class="card-header">
        ${e(t("recipe.form.group.times"))}
      </div>
      <div class="card-body">
        <!-- TODO use different widget -->
        <div class="row">
          <div class="col-sm">
            <label for="prepTime" class="form-label">
              ${e(t("recipe.prep_time"))}
            </label>
            <input type="number" min="0" class="form-control" id="prepTime" name="prepTime" value="${
    e(
      recipe
        ?.prepTime ?? "",
    )
  }">
            <div class="form-text">
              ${e(t("recipe.form.time_hint"))}
            </div>
          </div>
          <div class="col-sm">
            <label for="cookTime" class="form-label">
              ${e(t("recipe.cook_time"))}
            </label>
            <input type="number" min="0" class="form-control" id="cookTime" name="cookTime" value="${
    e(
      recipe
        ?.cookTime ?? "",
    )
  }">
            <div class="form-text">
              ${e(t("recipe.form.time_hint"))}
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="card mb-3">
      <div class="card-header">
        ${e(t("recipe.form.group.ratings"))}
      </div>
      <div class="card-body">
        <div class="row">
          <div class="col-sm">
            <label for="aggregateRatingValue" class="form-label">
              ${e(t("recipe.aggregate_rating_value"))}
            </label>
            <input type="number" min="0" step=".01" class="form-control" id="aggregateRatingValue" name="aggregateRatingValue"
                   value="${e(recipe?.aggregateRatingValue ?? "")}">
          </div>

          <div class="col-sm">
            <label for="aggregateRatingCount" class="form-label">
              ${e(t("recipe.aggregate_rating_count"))}
            </label>
            <input type="number" min="0" class="form-control" id="aggregateRatingCount" name="aggregateRatingCount"
                   value="${e(recipe?.aggregateRatingCount ?? "")}">
          </div>
          <div class="col-sm">
            <label for="rating" class="form-label">
              ${e(t("recipe.rating"))}
            </label>
            <input type="number" min="0" step=".5" class="form-control" id="rating" name="rating" value="${
    e(
      recipe
        ?.rating ?? "",
    )
  }">
          </div>
        </div>
      </div>
    </div>

    ${
    arrayField(
      t("recipe.ingredients.title"),
      t("recipe.form.create_ingredient"),
      "ingredients",
      false,
      recipe?.ingredients,
    )
  }
    ${
    arrayField(
      t("recipe.instructions"),
      t("recipe.form.create_instruction"),
      "instructions",
      true,
      recipe?.instructions,
    )
  }
    <!-- TODO edit tags, reviews, history, etc. -->

    <a class="btn btn-danger me-2" href="${
    recipe ? UrlGenerator.recipe(recipe) : UrlGenerator.recipeList()
  }">
      ${LabeledIcon(t("cancel"), "arrow-left", 2)}
    </a>
    <button type="submit" class="btn btn-primary">
      ${LabeledIcon(t("save"), "check-square-fill", 2)}
    </button>
  </form>
`);
