/** @jsxImportSource https://esm.sh/preact@10.10.6?pin=v67 */
import { Recipe } from "../../../data/model/recipe.ts";
import { UrlGenerator } from "../../../http/util/url-generator.ts";
import { l } from "../../../i18n/mod.ts";
import { Alert } from "../_components/alert.tsx";
import { Breadcrumb, BreadcrumbItem } from "../_components/breadcrumb.tsx";
import { Icon, LabeledIcon } from "../_components/icon.tsx";
import { Page } from "../_structure/page.tsx";
import { Template } from "./jsx-item-element.tsx";

const arrayFieldTextarea = (props: { name: string; item?: string }) => <textarea class="me" title="" name={props.name} required>{props.item}</textarea>;

const arrayFieldTextInput = (props: { name: string; item?: string }) => <input class="me" title="" name={props.name} required value={props.item} />;

const arrayFieldDateTimeInput = (props: { name: string; item?: Date }) => (
    <div class="datetime">
        <input type="date" name={props.name} required value={(props.item || new Date()).toLocaleDateString("en-CA")} step="any" />
        <input type="time" name={props.name} required value={props.item && props.item.toLocaleTimeString("en-GB")} step="any" />
    </div>
);

const ArrayField = <T,>(props: {
    title: string;
    createBtnLabel: string;
    name: string;
    renderer: (props: { name: string; item?: T }) => unknown; // TODO VNode
    array?: T[];
    moveControls: boolean;
}) => {
    const RenderItem = (innerProps: { item?: T; i: number; last?: boolean }) => (
        <li class="list-group-item">
            <div class="grid" style="grid-template-columns: 1fr auto; --gap: .5rem">
                {props.renderer({ name: props.name, item: innerProps.item })}

                <div class="flex">
                    {props.moveControls && (
                        <div class="btn-group mr">
                            <button type="button" data-hook="up" class="btn sm secondary" title={l.up} disabled={!innerProps.i}>
                                <Icon name="arrow-up" />
                            </button>
                            <button type="button" data-hook="down" class="btn sm secondary" title={l.down} disabled={innerProps.last}>
                                <Icon name="arrow-down" />
                            </button>
                        </div>
                    )}
                    <button type="button" data-hook="delete" class="btn sm danger" title={l.delete}>
                        <Icon name="trash" />
                    </button>
                </div>
            </div>
        </li>
    );

    return (
        <div class="card mb array-field">
            <div class="card-header">
                {props.title}
            </div>
            <ul class="list-group list-group-flush">
                {props.array?.map((item, i) => <RenderItem item={item} i={i} last={i === props.array!.length - 1} />)}
                <Template>
                    <RenderItem i={-1} />
                </Template>
            </ul>
            <div class="card-footer">
                <button type="button" class="btn sm primary" data-hook="create">
                    <LabeledIcon label={props.createBtnLabel} name="plus-square" />
                </button>
            </div>
        </div>
    );
};

export const RecipeEditTemplate = (props: { recipe?: Recipe } = {}) => (
    <Page title={props.recipe ? props.recipe.title : l.create}>
        {props.recipe
            ? (
                <Breadcrumb noMargin={false}>
                    <BreadcrumbItem title={props.recipe.title} url={UrlGenerator.recipe(props.recipe)} />
                    <BreadcrumbItem title={l.edit} url={UrlGenerator.recipeEdit(props.recipe)} />
                </Breadcrumb>
            )
            : (
                <Breadcrumb noMargin={false}>
                    <BreadcrumbItem title={l.create} url={UrlGenerator.recipeCreate()} />
                </Breadcrumb>
            )}

        <form method="POST" autocomplete="off" encType="multipart/form-data" id="edit-form">
            <div class="grid">
                <div class="col-lg-6 mb">
                    <div class="card h-100">
                        <div class="card-header">
                            {l.recipe.form.group.basic}
                        </div>
                        <div class="card-body">
                            <div class="mb">
                                <label for="title">
                                    {l.title} *
                                </label>
                                <input id="title" name="title" required value={props.recipe?.title ?? ""} />
                            </div>
                            <div class="mb">
                                <label for="description">
                                    {l.description}
                                </label>
                                <textarea id="description" name="description">{props.recipe?.description ?? ""}</textarea>
                            </div>
                            <div class="mb">
                                <label for="source">
                                    {l.recipe.source}
                                </label>
                                <input id="source" name="source" value={props.recipe?.source ?? ""} />
                            </div>
                            <div>
                                <label for="yield">
                                    {l.recipe.yield}
                                </label>
                                <input type="number" min="1" id="yield" name="yield" value={props.recipe?.yield ?? ""} />
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-lg-6 mb">
                    <div class="card h-100" id="image-picker">
                        <img class="img-responsive" src={UrlGenerator.thumbnail(props.recipe?.thumbnail ?? "")} alt="" loading="lazy" />
                        <div class="card-body hidden">
                            <input class="hidden" type="file" accept="image/*" name="thumbnail" />
                            <input type="hidden" name="shouldDeleteThumbnail" disabled />
                            <Alert type="danger" title={l.error.title} className="mb-0 mt-3">
                                {l.recipe.form.imageError}
                            </Alert>
                        </div>
                        <div class="card-footer">
                            <div class="d-flex justify-content-between flex-wrap align-items-center">
                                <small class="c-muted">
                                    {l.recipe.form.thumbnailHint}
                                </small>
                                <button
                                    type="button"
                                    disabled={!props.recipe || !props.recipe.thumbnail}
                                    class="btn sm danger"
                                    title={l.recipe.form.deleteThumbnail}
                                    data-hook="delete"
                                >
                                    <Icon name="trash" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card mb">
                <div class="card-header">
                    {l.recipe.form.group.nutrition}
                </div>
                <div class="card-body">
                    <div class="grid gy-3">
                        <div class="col-lg-2">
                            <label for="nutritionCalories">
                                {l.recipe.nutrition.calories}
                            </label>
                            <input id="nutritionCalories" name="nutritionCalories" value={props.recipe?.nutritionCalories ?? ""} />
                        </div>
                        <div class="col-lg-2">
                            <label for="nutritionCarbohydrate">
                                {l.recipe.nutrition.carbohydrate}
                            </label>
                            <input id="nutritionCarbohydrate" name="nutritionCarbohydrate" value={props.recipe?.nutritionCarbohydrate ?? ""} />
                        </div>
                        <div class="col-lg-2">
                            <label for="nutritionCholesterol">
                                {l.recipe.nutrition.cholesterol}
                            </label>
                            <input id="nutritionCholesterol" name="nutritionCholesterol" value={props.recipe?.nutritionCholesterol ?? ""} />
                        </div>
                        <div class="col-lg-2">
                            <label for="nutritionFat">
                                {l.recipe.nutrition.fat}
                            </label>
                            <input id="nutritionFat" name="nutritionFat" value={props.recipe?.nutritionFat ?? ""} />
                        </div>
                        <div class="col-lg-2">
                            <label for="nutritionFiber">
                                {l.recipe.nutrition.fiber}
                            </label>
                            <input id="nutritionFiber" name="nutritionFiber" value={props.recipe?.nutritionFiber ?? ""} />
                        </div>
                        <div class="col-lg-2">
                            <label for="nutritionProtein">
                                {l.recipe.nutrition.protein}
                            </label>
                            <input id="nutritionProtein" name="nutritionProtein" value={props.recipe?.nutritionProtein ?? ""} />
                        </div>
                        <div class="col-lg-2">
                            <label for="nutritionSaturatedFat">
                                {l.recipe.nutrition.saturatedFat}
                            </label>
                            <input id="nutritionSaturatedFat" name="nutritionSaturatedFat" value={props.recipe?.nutritionSaturatedFat ?? ""} />
                        </div>
                        <div class="col-lg-2">
                            <label for="nutritionSodium">
                                {l.recipe.nutrition.sodium}
                            </label>
                            <input id="nutritionSodium" name="nutritionSodium" value={props.recipe?.nutritionSodium ?? ""} />
                        </div>
                        <div class="col-lg-2">
                            <label for="nutritionSugar">
                                {l.recipe.nutrition.sugar}
                            </label>
                            <input id="nutritionSugar" name="nutritionSugar" value={props.recipe?.nutritionSugar ?? ""} />
                        </div>
                        <div class="col-lg-2">
                            <label for="nutritionTransFat">
                                {l.recipe.nutrition.transFat}
                            </label>
                            <input id="nutritionTransFat" name="nutritionTransFat" value={props.recipe?.nutritionTransFat ?? ""} />
                        </div>
                        <div class="col-lg-2">
                            <label for="nutritionUnsaturatedFat">
                                {l.recipe.nutrition.unsaturatedFat}
                            </label>
                            <input id="nutritionUnsaturatedFat" name="nutritionUnsaturatedFat" value={props.recipe?.nutritionUnsaturatedFat ?? ""} />
                        </div>
                    </div>
                </div>
            </div>

            <div class="card mb">
                <div class="card-header">
                    {l.recipe.form.group.times}
                </div>
                <div class="card-body">
                    {/*TODO use different widget */ ""}
                    <div class="grid eq-c">
                        <div class="col-sm">
                            <label for="prepTime">
                                {l.recipe.prepTime}
                            </label>
                            <input type="number" min="0" step="1" max="1440" id="prepTime" name="prepTime" value={props.recipe?.prepTime ?? ""} />
                            <div class="form-text">
                                {l.recipe.form.timeHint}
                            </div>
                        </div>
                        <div class="col-sm">
                            <label for="cookTime">
                                {l.recipe.cookTime}
                            </label>
                            <input type="number" min="0" step="1" max="1440" id="cookTime" name="cookTime" value={props.recipe?.cookTime ?? ""} />
                            <div class="form-text">
                                {l.recipe.form.timeHint}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card mb">
                <div class="card-header">
                    {l.recipe.form.group.ratings}
                </div>
                <div class="card-body">
                    <div class="grid" style="grid-template-columns: 1fr 1fr 1fr;">
                        <div class="col-sm">
                            <label for="aggregateRatingValue">
                                {l.recipe.aggregateRatingValue}
                            </label>
                            <input
                                type="number"
                                min="0"
                                step=".01"
                                id="aggregateRatingValue"
                                name="aggregateRatingValue"
                                value={props.recipe?.aggregateRatingValue ?? ""}
                            />
                        </div>

                        <div class="col-sm">
                            <label for="aggregateRatingCount">
                                {l.recipe.aggregateRatingCount}
                            </label>
                            <input
                                type="number"
                                min="0"
                                id="aggregateRatingCount"
                                name="aggregateRatingCount"
                                value={props.recipe?.aggregateRatingCount ?? ""}
                            />
                        </div>
                        <div class="col-sm">
                            <label for="rating">
                                {l.recipe.rating}
                            </label>
                            <input type="number" min="0" max="5" step=".5" id="rating" name="rating" value={props.recipe?.rating ?? ""} />
                        </div>
                    </div>
                </div>
            </div>

            <ArrayField
                title={l.recipe.history}
                createBtnLabel={l.recipe.form.addHistoryEntry}
                name="history"
                renderer={arrayFieldDateTimeInput}
                array={props.recipe?.history.reverse()}
                moveControls={false}
            />

            <ArrayField
                title={l.recipe.ingredients.title}
                createBtnLabel={l.recipe.form.createIngredient}
                name="ingredients"
                renderer={arrayFieldTextInput}
                array={props.recipe?.ingredients}
                moveControls={true}
            />

            <ArrayField
                title={l.recipe.instructions}
                createBtnLabel={l.recipe.form.createInstruction}
                name="instructions"
                renderer={arrayFieldTextarea}
                array={props.recipe?.instructions}
                moveControls={true}
            />

            {/*TODO edit tags, reviews, history, etc. -->*/ ""}

            <a class="btn danger mr" href={props.recipe ? UrlGenerator.recipe(props.recipe) : UrlGenerator.home()}>
                <LabeledIcon label={l.cancel} name="arrow-left" />
            </a>
            <button type="submit" class="btn primary">
                <LabeledIcon label={l.save} name="check-square-fill" />
            </button>
        </form>
    </Page>
);
