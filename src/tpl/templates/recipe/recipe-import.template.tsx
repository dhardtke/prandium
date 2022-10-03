/** @jsxImportSource https://esm.sh/preact@10.11.0?pin=v67 */
import { ImportResult } from "../../../data/parse/import/import-recipe.ts";
import { UrlGenerator } from "../../../http/util/url-generator.ts";
import { l } from "../../../i18n/mod.ts";
import { Alert } from "../_components/alert.tsx";
import { Breadcrumb, BreadcrumbItem } from "../_components/breadcrumb.tsx";
import { Icon, LabeledIcon } from "../_components/icon.tsx";
import { Page } from "../_structure/page.tsx";

export const RecipeImportTemplate = (props?: { results?: ImportResult[] }) => (
    <Page title={l.recipe.import.title}>
        <Breadcrumb noMargin={false}>
            <BreadcrumbItem title={l.recipe.import.title} url={UrlGenerator.recipeImport()} />
        </Breadcrumb>
        {props?.results
            ? (
                <>
                    <Alert type="info" title={l.info}>{l.recipe.import.alert}</Alert>
                    <div class="table-responsive">
                        <table class="table table-striped table-hover">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>{l.recipe.import.sourceUrl}</th>
                                    <th>{l.recipe.import.result}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {props.results.map((result, i) => (
                                    <tr>
                                        <td>{i + 1}</td>
                                        <td>
                                            <a href={result.url} target="_blank">
                                                {result.url}
                                            </a>
                                        </td>
                                        <td>
                                            {result.success
                                                ? (
                                                    <>
                                                        <Icon name="check" className="c-info me" large={true} />
                                                        <a class="btn success sm" href={UrlGenerator.recipe(result.recipe!)} target="_blank">
                                                            {l.recipe.open}
                                                        </a>
                                                    </>
                                                )
                                                : (
                                                    <span class="c-danger">
                                                        <Icon name="x" large={true} />
                                                        {result.error}
                                                    </span>
                                                )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )
            : (
                <form method="POST">
                    <div class="mb">
                        <label for="urls" class="form-label">
                            {l.recipe.import.urls}
                        </label>
                        <textarea rows={10} class="form-control" id="urls" name="urls" required></textarea>
                        <div class="form-text">
                            {l.recipe.import.urlInfo}
                        </div>
                    </div>
                    <button type="submit" class="btn primary">
                        <LabeledIcon label={l.recipe.import.title} name="cloud-arrow-down-fill" />
                    </button>
                </form>
            )}
    </Page>
);
