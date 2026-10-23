import type { RecipeSummaryDto } from '../../../../shared/dto/recipe.ts';
import type { RawHtml } from '../../../ui/html.ts';
import { define, PrElement } from '../../../ui/base.ts';
import { formatDate, formatMinutes, formatNumber, formatRelative } from '../../../ui/format.ts';
import { html, raw } from '../../../ui/html.ts';
import { t } from '../../../ui/i18n.ts';

export const PLACEHOLDER_THUMBNAIL = '/ui/placeholder.svg';

export class PrRecipeCardComponent extends PrElement {
  #recipe: RecipeSummaryDto | null = null;

  set recipe(value: RecipeSummaryDto | undefined) {
    this.#recipe = value ?? null;
    if (this.isConnected) {
      this.render();
    }
  }

  get recipe(): RecipeSummaryDto | undefined {
    return this.#recipe ?? undefined;
  }

  override handleAction(action: string): void {
    const recipe = this.#recipe;
    if (action === 'delete' && recipe) {
      this.emit('recipe-delete', recipe);
    }
  }

  #stats(recipe: RecipeSummaryDto): string {
    const l = t();
    const parts = [l.recipe.cookedTimes(recipe.cookedCount)];
    if (recipe.rating > 0) {
      parts.push(`★ ${formatNumber(recipe.rating, 1)}`);
    }
    if (recipe.aggregateRating.value !== null) {
      parts.push(`👥 ${formatNumber(recipe.aggregateRating.value)}`);
    }
    if (recipe.totalTime > 0) {
      parts.push(formatMinutes(recipe.totalTime));
    }
    return parts.join(' · ');
  }

  override template(): RawHtml {
    const recipe = this.#recipe;
    if (!recipe) {
      return raw('');
    }
    const l = t();
    return html`
      <article class="card open-card${recipe.flagged ? ' flagged' : ''}" data-testid="card">
        <img class="thumb" src="${recipe.thumbnail ?? PLACEHOLDER_THUMBNAIL}" alt="" loading="lazy" data-testid="thumbnail" />
        <div class="head">
          <a class="open" href="/recipes/${recipe.id}" data-testid="open">
            ${recipe.flagged ? html`<span class="flag" title="${l.recipe.flagged}" data-testid="flag">⚑</span>` : ''}${recipe.title}
          </a>
          <div class="actions">
            <ot-dropdown>
              <button type="button" class="ghost icon" popovertarget="menu" aria-label="${l.recipe.actions}" data-testid="menu-button">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <circle cx="5" cy="12" r="2" />
                  <circle cx="12" cy="12" r="2" />
                  <circle cx="19" cy="12" r="2" />
                </svg>
              </button>
              <menu popover id="menu" data-testid="menu">
                <a role="menuitem" href="/recipes/${recipe.id}/edit" data-testid="edit">${l.edit}</a>
                <button type="button" role="menuitem" class="danger" data-action="delete" data-testid="delete">${l.delete}</button>
              </menu>
            </ot-dropdown>
          </div>
        </div>
        ${recipe.description === '' ? '' : html`<p class="description text-light" data-testid="description">${recipe.description}</p>`}
        <small
          class="text-light"
          data-testid="cooked"
          ${recipe.lastCookedAt === null ? '' : html`title="${formatDate(recipe.lastCookedAt, { dateStyle: 'full', timeStyle: 'short' })}"`}
        >
          ${recipe.lastCookedAt === null ? l.recipe.notCookedYet : l.recipe.lastCooked(formatRelative(recipe.lastCookedAt))}
        </small>
        <div class="foot">
          <span class="text-light" data-testid="stats">${this.#stats(recipe)}</span>
        </div>
      </article>
    `;
  }
}

await define('pr-recipe-card', PrRecipeCardComponent, import.meta.url);
