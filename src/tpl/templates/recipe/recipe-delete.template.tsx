/** @jsxImportSource https://esm.sh/preact@10.11.0?pin=v67 */
import { Recipe } from "../../../data/model/recipe.ts";
import { UrlGenerator } from "../../../http/util/url-generator.ts";
import { l } from "../../../i18n/mod.ts";
import { Breadcrumb, BreadcrumbItem } from "../_components/breadcrumb.tsx";
import { LabeledIcon } from "../_components/icon.tsx";
import { Page } from "../_structure/page.tsx";

export const RecipeDeleteTemplate = (props: { recipe: Recipe }) => (
    <Page title={props.recipe.title}>
        <Breadcrumb noMargin={false}>
            <BreadcrumbItem title={props.recipe.title} url={UrlGenerator.recipe(props.recipe)} />
            <BreadcrumbItem title={l.delete} url={UrlGenerator.recipeDelete(props.recipe)} />
        </Breadcrumb>

        <form method="POST">
            <h1>{l.confirmation}</h1>
            <p>{l.recipe.deleteConfirmation}</p>

            <div class="btn-bar">
                <a class="btn primary col-12 col-lg-4" href={UrlGenerator.recipe(props.recipe)}>
                    <LabeledIcon label={l.no} name="arrow-left" />
                </a>
                <button type="submit" class="btn danger col-12 col-lg-4">
                    <LabeledIcon label={l.yes} name="trash" />
                </button>
            </div>
        </form>
    </Page>
);
