import type { NutritionDto, RecipeDto } from '../../../shared/dto/recipe.ts';
import type { RawHtml } from '../../ui/html.ts';
import { navigate } from '../../app/router.ts';
import { define } from '../../ui/base.ts';
import { confirmAction } from '../../ui/confirm/confirm.ts';
import { formatDate, formatMinutes, formatNumber, formatRelative } from '../../ui/format.ts';
import { html } from '../../ui/html.ts';
import { t } from '../../ui/i18n.ts';
import { toast, toastError } from '../../ui/toast.ts';
import { PrView } from '../../ui/view.ts';
import type { PrIngredientsComponent } from './internal/pr-ingredients.component.ts';
import './internal/pr-ingredients.component.ts';
import './internal/pr-rating.component.ts';
import { ScreenWakeLock } from './internal/wake-lock.ts';
import { recipeFacade } from './recipes.facade.ts';

const NUTRITION_ORDER: readonly (keyof NutritionDto)[] = [
  'calories',
  'fiber',
  'fat',
  'saturatedFat',
  'unsaturatedFat',
  'transFat',
  'carbohydrate',
  'sugar',
  'protein',
  'cholesterol',
  'sodium',
];

/** A source is linked only when it is an http(s) URL; anything else an import or an old row stored shows as text. */
export function sourceUrl(source: string): URL | null {
  try {
    const url = new URL(source);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url : null;
  } catch {
    return null;
  }
}

export class PrRecipeDetailComponent extends PrView<RecipeDto> {
  readonly #wakeLock = new ScreenWakeLock();

  override connectedCallback(): void {
    super.connectedCallback();
    this.#wakeLock.acquire();
    this.root.addEventListener('rating-change', (event) => {
      if (event instanceof CustomEvent && typeof event.detail === 'number' && event.target instanceof HTMLElement && event.target.dataset.testid === 'rating') {
        void this.#update({ rating: event.detail });
      }
    });
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.#wakeLock.release();
  }

  override load(): Promise<RecipeDto> {
    return recipeFacade.get(this.numericAttribute('recipe-id'));
  }

  override titleFor(recipe: RecipeDto): string {
    return recipe.title;
  }

  override async handleAction(action: string): Promise<void> {
    const recipe = this.data;
    if (!recipe) {
      return;
    }
    if (action === 'flag') {
      await this.#update({ flagged: !recipe.flagged });
    } else if (action === 'delete') {
      await this.#delete(recipe);
    }
  }

  // Flag and rating patch the page in place, so the rest of it (portions typed, steps folded) stays as it is.
  async #update(change: { flagged?: boolean; rating?: number }): Promise<void> {
    const recipe = this.data;
    if (!recipe) {
      return;
    }
    let updated: RecipeDto;
    try {
      updated = await recipeFacade.update(recipe.id, change);
    } catch (error) {
      toastError(error);
      this.#patch(recipe);
      return;
    }
    this.replaceData(updated);
    this.#patch(updated);
  }

  #patch(recipe: RecipeDto): void {
    const l = t();
    const flag = this.$('[data-testid="flag"]');
    if (flag) {
      flag.textContent = recipe.flagged ? l.recipe.unflag : l.recipe.flag;
      flag.setAttribute('aria-pressed', String(recipe.flagged));
    }
    this.$('[data-testid="flag-mark"]')?.toggleAttribute('hidden', !recipe.flagged);
    const rating = this.$('[data-testid="rating"]');
    rating?.setAttribute('value', String(recipe.rating));
    const value = this.$('[data-testid="rating-value"]');
    if (value) {
      value.textContent = this.#ratingText(recipe.rating);
    }
    const history = this.$('[data-testid="history"]');
    if (history) {
      history.innerHTML = String(this.#history(recipe));
    }
  }

  async #delete(recipe: RecipeDto): Promise<void> {
    const l = t();
    const confirmed = await confirmAction({
      title: l.recipe.deleteTitle(recipe.title),
      message: l.recipe.deleteConfirmation,
      confirmLabel: l.delete,
      danger: true,
    });
    if (!confirmed) {
      return;
    }
    try {
      await recipeFacade.delete(recipe.id);
    } catch (error) {
      toastError(error);
      return;
    }
    toast(l.recipe.deleteSuccessful, 'success');
    navigate('/');
  }

  #ratingText(rating: number): string {
    return rating > 0 ? formatNumber(rating, 1) : t().recipe.noRating;
  }

  #history(recipe: RecipeDto): RawHtml {
    if (recipe.history.length === 0) {
      return html`<p class="text-light">${t().recipe.notCookedYet}</p>`;
    }
    return html`<ul>
      ${recipe.history.map((entry) => html`<li title="${formatDate(entry, { dateStyle: 'full', timeStyle: 'short' })}">${formatRelative(entry)}</li>`)}
    </ul>`;
  }

  #nutrition(recipe: RecipeDto): RawHtml {
    const l = t();
    const rows = NUTRITION_ORDER.flatMap((key) => {
      const value = recipe.nutrition[key];
      return value === null || value === ''
        ? []
        : [
            html`<tr>
              <th scope="row">${l.recipe.nutrition[key]}</th>
              <td>${value}</td>
            </tr>`,
          ];
    });
    if (rows.length === 0) {
      return html``;
    }
    return html`
      <section class="card" data-testid="nutrition">
        <h3>${l.nutritionalValue}</h3>
        <div class="table">
          <table>
            <tbody>
              ${rows}
            </tbody>
          </table>
        </div>
      </section>
    `;
  }

  #times(recipe: RecipeDto): RawHtml {
    const l = t();
    const rows: [string, number][] = [
      [l.recipe.time.prep, recipe.prepTime],
      [l.recipe.time.cook, recipe.cookTime],
      [l.recipe.time.total, recipe.totalTime],
    ];
    const shown = rows.filter(([, minutes]) => minutes > 0);
    return html`
      <section class="card" data-testid="times">
        <h3>${l.recipe.form.group.times}</h3>
        ${
          shown.length === 0
            ? html`<p class="text-light">${l.recipe.noTimes}</p>`
            : html`<div class="table">
                <table>
                  <tbody>
                    ${shown.map(
                      ([label, minutes]) =>
                        html`<tr>
                          <th scope="row">${label}</th>
                          <td>${formatMinutes(minutes)}</td>
                        </tr>`,
                    )}
                  </tbody>
                </table>
              </div>`
        }
      </section>
    `;
  }

  #header(recipe: RecipeDto): RawHtml {
    const l = t();
    const source = sourceUrl(recipe.source);
    const { value, count } = recipe.aggregateRating;
    return html`
      <header class="vstack gap-2">
        <div class="title hstack justify-between gap-2">
          <h1><span class="flag-mark" data-testid="flag-mark" ${recipe.flagged ? '' : 'hidden'}>⚑ </span><span data-testid="title">${recipe.title}</span></h1>
          <div class="hstack gap-2">
            <button type="button" class="outline" data-action="flag" aria-pressed="${String(recipe.flagged)}" data-testid="flag">
              ${recipe.flagged ? l.recipe.unflag : l.recipe.flag}
            </button>
            <a class="button outline" href="/recipes/${recipe.id}/edit" data-testid="edit">${l.edit}</a>
            <button type="button" data-variant="danger" data-action="delete" data-testid="delete">${l.delete}</button>
          </div>
        </div>
        ${
          source !== null || recipe.source !== '' || value !== null
            ? html`<div class="meta hstack gap-3 text-light">
                ${
                  source
                    ? html`<a href="${source.href}" target="_blank" rel="noopener noreferrer" data-testid="source">${source.hostname} ↗</a>`
                    : recipe.source === ''
                      ? ''
                      : html`<span data-testid="source-text">${recipe.source}</span>`
                }
                ${
                  value === null
                    ? ''
                    : html`<span class="hstack gap-1" title="${l.recipe.aggregateRating}" data-testid="aggregate-rating">
                        ${l.recipe.aggregateRating}
                        <pr-rating readonly value="${Math.min(5, value)}" label="${l.recipe.aggregateRating}"></pr-rating>
                        ${formatNumber(value)}${count === null ? '' : ` (${l.recipe.ratingCount(count)})`}
                      </span>`
                }
              </div>`
            : ''
        }
        ${
          recipe.tags.length === 0
            ? ''
            : html`<div class="tags hstack gap-2" data-testid="tags">
                ${recipe.tags.map((tag) => html`<a class="badge" href="/?tag=${tag.id}">${tag.title}</a>`)}
              </div>`
        }
        ${recipe.description === '' ? '' : html`<p class="description" data-testid="description">${recipe.description}</p>`}
      </header>
    `;
  }

  override afterRender(): void {
    const recipe = this.data;
    const ingredients = this.$<PrIngredientsComponent>('pr-ingredients');
    if (recipe && ingredients) {
      ingredients.recipe = { ingredients: recipe.ingredients, yield: recipe.yield };
    }
  }

  override readyTemplate(recipe: RecipeDto): RawHtml {
    const l = t();
    return html`
      <article class="vstack gap-4">
        ${this.#header(recipe)}
        <div class="top">
          ${recipe.thumbnail === null ? '' : html`<img class="thumbnail" src="${recipe.thumbnail}" alt="" data-testid="thumbnail" />`}
          <section class="card your-rating" data-testid="your-rating">
            <h3>${l.recipe.rating}</h3>
            <div class="hstack gap-3">
              <pr-rating value="${recipe.rating}" label="${l.recipe.rating}" data-testid="rating"></pr-rating>
              <span class="text-light" data-testid="rating-value">${this.#ratingText(recipe.rating)}</span>
            </div>
          </section>
        </div>
        <div class="facts">
          ${this.#nutrition(recipe)} ${this.#times(recipe)}
          <section class="card">
            <h3>${l.recipe.history}</h3>
            <div data-testid="history">${this.#history(recipe)}</div>
          </section>
        </div>
        ${recipe.ingredients.length === 0 ? '' : html`<pr-ingredients data-testid="ingredients"></pr-ingredients>`}
        ${
          recipe.instructions.length === 0
            ? ''
            : html`<section class="vstack gap-2" data-testid="instructions">
                <h2>${l.recipe.instructions}</h2>
                ${recipe.instructions.map(
                  (instruction, i) =>
                    html`<details open data-testid="step">
                      <summary>${l.recipe.ingredients.step(i + 1)}</summary>
                      <p class="step">${instruction}</p>
                    </details>`,
                )}
              </section>`
        }
        ${
          recipe.reviews.length === 0
            ? ''
            : html`<section class="vstack gap-2" data-testid="reviews">
                <h2>${l.recipe.reviews}</h2>
                ${recipe.reviews.map(
                  (review) =>
                    html`<blockquote class="review">
                      <p>${review.text}</p>
                      <footer class="text-light">${formatDate(review.date)}</footer>
                    </blockquote>`,
                )}
              </section>`
        }
      </article>
    `;
  }
}

await define('pr-recipe-detail', PrRecipeDetailComponent, import.meta.url);
