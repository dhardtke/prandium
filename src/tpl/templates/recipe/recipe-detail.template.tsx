/** @jsxImportSource https://esm.sh/preact@10.10.6?pin=v67 */
import { classNames } from "../../../../deps.ts";
import { Recipe } from "../../../data/model/recipe.ts";
import { Ingredient, ingredient as ingredientHelper } from "../../../data/parse/ingredient/mod.ts";
import { UrlGenerator } from "../../../http/util/url-generator.ts";
import { l } from "../../../i18n/mod.ts";
import { date, number } from "../../util/format.ts";
import { Alert } from "../_components/alert.tsx";
import { Breadcrumb, BreadcrumbItem } from "../_components/breadcrumb.tsx";
import { Collapsible } from "../_components/collapsible.tsx";
import { Icon, LabeledIcon } from "../_components/icon.tsx";
import { Rating } from "../_components/rating.tsx";
import { Page } from "../_structure/page.tsx";

const NutritionTable = (props: { recipe: Recipe }) => {
    const { nutrition } = l.recipe;
    // TODO use Nutrition type
    const fields: (string | undefined)[][] = [
        [nutrition.calories, props.recipe.nutritionCalories],
        [nutrition.fiber, props.recipe.nutritionFiber],
        [nutrition.fat, props.recipe.nutritionFat],
        [nutrition.saturatedFat, props.recipe.nutritionSaturatedFat],
        [nutrition.unsaturatedFat, props.recipe.nutritionUnsaturatedFat],
        [nutrition.carbohydrate, props.recipe.nutritionCarbohydrate],
        [nutrition.sugar, props.recipe.nutritionSugar],
        [nutrition.protein, props.recipe.nutritionProtein],
        [nutrition.sodium, props.recipe.nutritionSodium],
    ].filter(([_, value]) => Boolean(value));
    return (
        <>
            {fields.length
                ? (
                    <div class="col-12 col-lg-6">
                        <h5>{l.nutritionalValue}</h5>
                        <div class="table-responsive">
                            <table class="fw">
                                <colgroup>
                                    <col style="width: 50%" />
                                    <col style="width: 50%" />
                                </colgroup>
                                {fields.map(([label, value]) => (
                                    <tr>
                                        <th>{label}</th>
                                        <td>{value}</td>
                                    </tr>
                                ))}
                            </table>
                        </div>
                    </div>
                )
                : ""}
        </>
    );
};

const History = (props: { recipe: Recipe }) => (
    <div class="col-12 col-lg-6">
        <h5>{l.recipe.history}</h5>
        {props.recipe.history.length
            ? (
                <ul class="disc">
                    {props.recipe.history.map((d) => <li title={date.format(d)}>{date.formatRelative(d)}</li>)}
                </ul>
            )
            : l.recipe.notCookedYet}
    </div>
);

const Times = (props: { recipe: Recipe }) => (
    <div class="col-12 col-lg-6">
        <h5>{l.recipe.form.group.times}</h5>
        {props.recipe.prepTime || props.recipe.cookTime
            ? (
                <div class="table-responsive">
                    <table class="fw">
                        <colgroup>
                            <col style="width: 50%" />
                            <col style="width: 50%" />
                        </colgroup>
                        {props.recipe.prepTime
                            ? (
                                <tr>
                                    <th>{l.recipe.time.prep}</th>
                                    <td>{date.formatMinutes(props.recipe.prepTime)}</td>
                                </tr>
                            )
                            : ""}
                        {props.recipe.cookTime
                            ? (
                                <tr>
                                    <th>{l.recipe.time.cook}</th>
                                    <td>{date.formatMinutes(props.recipe.cookTime)}</td>
                                </tr>
                            )
                            : ""}
                        {props.recipe.totalTime
                            ? (
                                <tr>
                                    <th>{l.recipe.time.total}</th>
                                    <td>{date.formatMinutes(props.recipe.totalTime)}</td>
                                </tr>
                            )
                            : ""}
                    </table>
                </div>
            )
            : l.recipe.noTimes}
    </div>
);

const IngredientQuantity = (props: { ingredient: Ingredient }) => {
    if (props.ingredient.quantity) {
        let text = "";

        if (typeof props.ingredient.quantity === "number") {
            text += props.ingredient.quantity;
        } else {
            text += `${props.ingredient.quantity.from} - ${props.ingredient.quantity.to}`;
        }

        if (props.ingredient.unit) {
            text += " " + props.ingredient.unit;
        }

        return <span class="badge">{text}</span>;
    }
    return <></>;
};

const YourRating = (props: { recipe: Recipe }) => (
    <div class="col-12 col-lg-6" id="recipe-rating">
        <div class="side-by-side">
            <h5>{l.recipe.rating}</h5>
            <small class="current c-muted">{number.format(props.recipe.rating, 1)}</small>
        </div>
        <Rating name="rating" value={props.recipe.rating} />
    </div>
);

const Ingredients = (props: { recipe: Recipe; portions?: number }) => (
    <>
        {props.recipe.ingredients.length
            ? (
                <div class="card mb">
                    <a class="anchor" id="ingredients"></a>
                    <div class="card-header">
                        <div class="side-by-side">
                            <h5>{l.recipe.ingredients.title}</h5>
                            <form id="ingredients-form" action="#ingredients">
                                <div class="input-group input-group-sm w-auto">
                                    <input
                                        type="number"
                                        class="form-control portions"
                                        name="portions"
                                        value={props.portions}
                                        min="1"
                                        max="99"
                                        title={l.recipe.portions}
                                    />
                                    <div class="input-group-text">
                                        {l.recipe.portions}
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
                        {ingredientHelper.parseMany(props.recipe.ingredients, props.recipe.yield, props.portions).map((ingredient) => (
                            <li class="list-group-item">
                                <div class="flex">
                                    <div class="ingredient-quantity">
                                        {ingredient.quantity ? <IngredientQuantity ingredient={ingredient} /> : ""}
                                    </div>
                                    <div>
                                        {ingredient.description}
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )
            : ""}
    </>
);

const Instructions = (props: { recipe: Recipe }) => (
    <>
        {props.recipe.instructions.length
            ? (
                <div class="mb card-set">
                    <h3>{l.recipe.instructions}</h3>
                    {props.recipe.instructions.map((instruction, i) => (
                        <Collapsible
                            id={`collapsible-instruction${i}`}
                            label={l.recipe.ingredients.step(i + 1)}
                            opened={true}
                            wrapperClass="card"
                            labelClass="card-header"
                            contentClass="card-body"
                            caret="right"
                        >
                            {instruction}
                        </Collapsible>
                    ))}
                </div>
            )
            : ""}
    </>
);

const Reviews = (props: { recipe: Recipe }) => (
    <>
        {props.recipe.reviews.length
            ? (
                <>
                    <h3>{l.recipe.reviews}</h3>
                    <ul class="dash">
                        {props.recipe.reviews.map((review, i) => (
                            <li class={classNames({ "mb": i < props.recipe.reviews.length - 1 })}>
                                <p class="mbo">{review.text}</p>
                                <span class="c-muted">{date.format(review.date)}</span>
                            </li>
                        ))}
                    </ul>
                </>
            )
            : ""}
    </>
);

export const RecipeDetailTemplate = (props: { recipe: Recipe; portions?: number }) => {
    const flashParameter = Page.currentUrl.searchParams.get("flash");
    return (
        <Page title={props.recipe.title}>
            <div class="side-by-side mb">
                <Breadcrumb noMargin={true}>
                    <BreadcrumbItem title={props.recipe.title} url={UrlGenerator.recipe(props.recipe)} />
                </Breadcrumb>
                <div class="side-by-side">
                    {props.recipe.source
                        ? (
                            <a href={props.recipe.source} target="_blank" class="spacer-r">
                                <LabeledIcon label={new URL(props.recipe.source).hostname} name="link-45deg" />
                            </a>
                        )
                        : ""}
                    <div class="side-by-side" title={l.recipe.aggregateRating}>
                        <Rating name="aggregate_rating" value={props.recipe.aggregateRatingValue} readonly={true} small={true} />
                        <small class="current ml">{number.format(props.recipe.aggregateRatingValue, 2)}</small>
                    </div>
                </div>
            </div>

            <div class="side-by-side mb">
                <h1 class="mbo">
                    {props.recipe.flagged
                        ? (
                            <span class="mr">
                                <Icon name="flag-fill" className="c-info" large={true} />
                            </span>
                        )
                        : ""}
                    {props.recipe.title}
                </h1>
                <div class="action-bar">
                    <a href={UrlGenerator.recipeFlag(props.recipe)} class="btn info">
                        <LabeledIcon label={props.recipe.flagged ? l.recipe.unflag : l.recipe.flag} name="flag" />
                    </a>
                    <a href={UrlGenerator.recipeEdit(props.recipe)} class="btn secondary">
                        <LabeledIcon label={l.edit} name="pencil" />
                    </a>
                    <a href={UrlGenerator.recipeDelete(props.recipe)} class="btn danger">
                        <LabeledIcon label={l.delete} name="trash" />
                    </a>
                </div>
            </div>
            {flashParameter === "editSuccessful"
                ? <Alert type="success" title={l.info}>{l.recipe.editSuccessful}</Alert>
                : flashParameter === "createSuccessful"
                ? <Alert type="success" title={l.info}>{l.recipe.createSuccessful}</Alert>
                : ""}

            {props.recipe.tags.length
                ? (
                    <div class="flex">
                        {props.recipe.tags.map((tag, i) => (
                            <a
                                title={tag.description}
                                href={UrlGenerator.home({ tagIds: [tag.id!], tagFilter: true })}
                                class={classNames("badge", "mb", { mr: i < props.recipe.tags.length - 1 })}
                            >
                                {tag.title}
                            </a>
                        ))}
                    </div>
                )
                : ""}

            <div class="grid">
                <NutritionTable recipe={props.recipe} />
                <History recipe={props.recipe} />
                <Times recipe={props.recipe} />
                <YourRating recipe={props.recipe} />
            </div>

            {props.recipe.description ? <p class="lead">{props.recipe.description}</p> : ""}

            {/*TODO show metadata like last cooked, etc.?*/ ""}

            {props.recipe.thumbnail
                ? (
                    <div class="mb">
                        <img class="img-thumbnail" src={UrlGenerator.thumbnail(props.recipe.thumbnail)} alt="" loading="lazy" />
                    </div>
                )
                : ""}

            <Ingredients recipe={props.recipe} portions={props.portions} />
            <Instructions recipe={props.recipe} />
            <Reviews recipe={props.recipe} />
        </Page>
    );
};
