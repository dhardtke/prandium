import type { ImportResultItemDto } from '../../../shared/dto/recipe.ts';
import type { RawHtml } from '../../ui/html.ts';
import { define, CeElement } from '../../ui/base.ts';
import { html } from '../../ui/html.ts';
import { t } from '../../ui/i18n.ts';
import { toast, toastError } from '../../ui/toast.ts';
import { recipeFacade } from './recipes.facade.ts';

/** Not a CeView: it has nothing to load and shows its form at once. */
export class CeRecipeImportComponent extends CeElement {
  #results: ImportResultItemDto[] | null = null;
  #busy = false;

  // The typed URLs survive a language change.
  override languageChanged(): void {
    const text = this.$<HTMLTextAreaElement>('textarea')?.value ?? '';
    this.render();
    const textarea = this.$<HTMLTextAreaElement>('textarea');
    if (textarea) {
      textarea.value = text;
    }
  }

  override async handleSubmit(action: string, form: HTMLFormElement): Promise<void> {
    if (action !== 'import' || this.#busy) {
      return;
    }
    const urls = (this.formData(form).urls ?? '')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line !== '');
    if (urls.length === 0) {
      return;
    }
    this.#busy = true;
    const button = this.$('[data-testid="submit"]');
    button?.setAttribute('aria-busy', 'true');
    button?.setAttribute('disabled', '');
    try {
      this.#results = (await recipeFacade.import({ urls })).results;
    } catch (error) {
      toastError(error);
      return;
    } finally {
      this.#busy = false;
      button?.removeAttribute('aria-busy');
      button?.removeAttribute('disabled');
    }
    toast(t().recipe.import.alert, 'success');
    const results = this.$('[data-testid="results"]');
    if (results) {
      results.innerHTML = String(this.#table(this.#results));
    }
  }

  #table(results: ImportResultItemDto[] | null): RawHtml {
    if (results === null) {
      return html``;
    }
    const l = t();
    return html`
      <div class="table">
        <table>
          <thead>
            <tr>
              <th class="num">#</th>
              <th>${l.recipe.import.sourceUrl}</th>
              <th>${l.recipe.import.result}</th>
            </tr>
          </thead>
          <tbody>
            ${results.map(
              (result, i) =>
                html`<tr data-testid="result">
                  <td class="num">${i + 1}</td>
                  <td class="url"><a href="${result.url}" target="_blank" rel="noopener noreferrer">${result.url} ↗</a></td>
                  <td>
                    ${
                      result.recipe === null
                        ? html`<span class="failed" data-testid="error">✗ ${result.error ?? ''}</span>`
                        : html`<span class="succeeded">✓</span>
                            <a class="button outline" href="/recipes/${result.recipe.id}" data-testid="open">${l.recipe.open}</a>
                            <span class="text-light">${result.recipe.title}</span>`
                    }
                  </td>
                </tr>`,
            )}
          </tbody>
        </table>
      </div>
    `;
  }

  override template(): RawHtml {
    const l = t();
    return html`
      <div class="vstack gap-4">
        <h1>${l.recipe.import.title}</h1>
        <form class="card vstack gap-3" data-action="import" data-testid="form">
          <div class="field">
            <label for="urls">${l.recipe.import.urls}</label>
            <textarea id="urls" name="urls" rows="10" required placeholder="https://" data-testid="urls"></textarea>
            <small class="text-light">${l.recipe.import.urlInfo}</small>
          </div>
          <div><button type="submit" data-testid="submit">${l.recipe.import.title}</button></div>
        </form>
        <div data-testid="results">${this.#table(this.#results)}</div>
      </div>
    `;
  }
}

await define('ce-recipe-import', CeRecipeImportComponent, import.meta.url);
