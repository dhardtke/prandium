import type { IngredientDto, QuantityDto } from '../../../../shared/dto/recipe.ts';
import type { RawHtml } from '../../../ui/html.ts';
import { define, PrElement } from '../../../ui/base.ts';
import { formatDecimal } from '../../../ui/format.ts';
import { html } from '../../../ui/html.ts';
import { t } from '../../../ui/i18n.ts';
import { clampPortions, initialPortions, MAX_PORTIONS, MIN_PORTIONS, scaleQuantity, sortIngredients } from './portions.ts';

function formatQuantity(quantity: QuantityDto): string {
  return typeof quantity === 'number' ? formatDecimal(quantity) : `${formatDecimal(quantity.from)}–${formatDecimal(quantity.to)}`;
}

/** Scales locally: changing the portions sends no request and only rewrites `?portions=`. */
export class PrIngredientsComponent extends PrElement {
  #ingredients: IngredientDto[] = [];
  #yield: number | null = null;
  #portions = 1;

  set recipe(value: { ingredients: IngredientDto[]; yield: number | null }) {
    this.#ingredients = sortIngredients(value.ingredients);
    this.#yield = value.yield;
    this.#portions = initialPortions(location.search, value.yield);
    if (this.isConnected) {
      this.render();
    }
  }

  get portions(): number {
    return this.#portions;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.root.addEventListener('change', (event) => {
      if (event.target instanceof HTMLInputElement && event.target.name === 'portions') {
        this.#setPortions(Number(event.target.value));
      }
    });
  }

  override handleAction(action: string): void {
    if (action === 'more') {
      this.#setPortions(this.#portions + 1);
    } else if (action === 'less') {
      this.#setPortions(this.#portions - 1);
    }
  }

  #setPortions(value: number): void {
    this.#portions = Number.isFinite(value) ? clampPortions(value) : this.#portions;
    const url = new URL(location.href);
    url.searchParams.set('portions', String(this.#portions));
    history.replaceState(history.state, '', url.pathname + url.search + url.hash);
    // Patched rather than re-rendered, so the number field keeps focus.
    const input = this.$<HTMLInputElement>('input[name="portions"]');
    if (input) {
      input.value = String(this.#portions);
    }
    this.$<HTMLButtonElement>('[data-action="less"]')?.toggleAttribute('disabled', this.#portions <= MIN_PORTIONS);
    this.$<HTMLButtonElement>('[data-action="more"]')?.toggleAttribute('disabled', this.#portions >= MAX_PORTIONS);
    const list = this.$('[data-testid="list"]');
    if (list) {
      list.innerHTML = String(this.#rows());
    }
  }

  #rows(): RawHtml {
    return html`${this.#ingredients.map((ingredient) => {
      const quantity = ingredient.quantity === null ? '' : formatQuantity(scaleQuantity(ingredient.quantity, this.#yield, this.#portions));
      const amount = [quantity, ingredient.quantity === null ? '' : (ingredient.unit ?? '')].filter((part) => part !== '').join(' ');
      return html`<tr data-testid="ingredient">
        <td class="amount nowrap" data-testid="amount">${amount}</td>
        <td data-testid="description">${ingredient.quantity === null ? ingredient.raw : ingredient.description}</td>
      </tr>`;
    })}`;
  }

  override template(): RawHtml {
    const l = t();
    return html`
      <section class="card vstack gap-3">
        <header class="hstack justify-between gap-2">
          <h2>${l.recipe.ingredients.title}</h2>
          <div class="portions hstack gap-1" role="group" aria-label="${l.recipe.portions}">
            <label for="portions">${l.recipe.portions}</label>
            <button type="button" class="outline icon" data-action="less" aria-label="−" data-testid="less" ${this.#portions <= MIN_PORTIONS ? 'disabled' : ''}>
              −
            </button>
            <input
              id="portions"
              name="portions"
              type="number"
              inputmode="numeric"
              min="${MIN_PORTIONS}"
              max="${MAX_PORTIONS}"
              step="1"
              value="${this.#portions}"
              data-testid="portions"
            />
            <button type="button" class="outline icon" data-action="more" aria-label="+" data-testid="more" ${this.#portions >= MAX_PORTIONS ? 'disabled' : ''}>
              +
            </button>
          </div>
        </header>
        <div class="table">
          <table>
            <tbody data-testid="list">
              ${this.#rows()}
            </tbody>
          </table>
        </div>
      </section>
    `;
  }
}

await define('pr-ingredients', PrIngredientsComponent, import.meta.url);
