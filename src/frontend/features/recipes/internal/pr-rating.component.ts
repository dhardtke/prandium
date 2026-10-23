import type { RawHtml } from '../../../ui/html.ts';
import { define, PrElement } from '../../../ui/base.ts';
import { html } from '../../../ui/html.ts';

const STAR = 'M12 2.5l2.94 6.1 6.56.9-4.8 4.6 1.18 6.6L12 17.5l-5.88 3.2 1.18-6.6-4.8-4.6 6.56-.9z';

/** Ten half-star radios; `value` rounds to the nearest half. Emits `rating-change` with the chosen value unless `readonly`. */
export class PrRatingComponent extends PrElement {
  static observedAttributes = ['value', 'readonly', 'label'];

  attributeChangedCallback(): void {
    if (this.isConnected) {
      this.render();
    }
  }

  get value(): number {
    return Math.round(Number(this.getAttribute('value') ?? 0) * 2) / 2;
  }

  set value(value: number) {
    this.setAttribute('value', String(value));
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.root.addEventListener('change', (event) => {
      if (event.target instanceof HTMLInputElement && !this.hasAttribute('readonly')) {
        this.emit('rating-change', Number(event.target.value));
      }
    });
  }

  override template(): RawHtml {
    const readonly = this.hasAttribute('readonly');
    const value = this.value;
    // Highest first, so `:checked ~ label` and `label:hover ~ label` reach the lower stars in a row-reverse.
    const steps = Array.from({ length: 10 }, (_, i) => (10 - i) / 2);
    return html`
      <div class="stars${readonly ? ' readonly' : ''}" role="radiogroup" aria-label="${this.getAttribute('label') ?? ''}" data-testid="stars">
        ${steps.map(
          (step) => html`
            <input
              type="radio"
              id="star-${step * 2}"
              name="rating"
              value="${step}"
              aria-label="${step}"
              ${step === value ? 'checked' : ''}
              ${readonly ? 'disabled' : ''}
              data-testid="star-${step * 2}"
            />
            <label for="star-${step * 2}" class="${step % 1 === 0 ? 'full' : 'half'}" title="${readonly ? '' : String(step)}">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="${STAR}" /></svg>
            </label>
          `,
        )}
      </div>
    `;
  }
}

await define('pr-rating', PrRatingComponent, import.meta.url);
