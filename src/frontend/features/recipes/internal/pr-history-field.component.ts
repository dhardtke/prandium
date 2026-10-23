import type { Iso8601DateTime } from '../../../../shared/flavors.ts';
import type { RawHtml } from '../../../ui/html.ts';
import { define, PrElement } from '../../../ui/base.ts';
import { html } from '../../../ui/html.ts';
import { t } from '../../../ui/i18n.ts';
import { fromLocalParts, toLocalParts } from './history-time.ts';

interface Entry {
  date: string;
  time: string;
  /** The stored value, kept while the row is untouched so its seconds survive a save. */
  original?: string;
}

function toEntry(iso: string): Entry {
  return { ...toLocalParts(iso), original: iso };
}

function isoOf(entry: Entry): Iso8601DateTime | null {
  if (entry.original !== undefined) {
    const parts = toLocalParts(entry.original);
    if (parts.date === entry.date && parts.time === entry.time) {
      return entry.original;
    }
  }
  return fromLocalParts(entry.date, entry.time);
}

/** When the recipe was cooked: one date and time per entry, in local time. Emits `input` on any change. */
export class PrHistoryFieldComponent extends PrElement {
  static observedAttributes = ['label'];

  #entries: Entry[] = [];

  attributeChangedCallback(): void {
    if (this.isConnected) {
      this.#rerender();
    }
  }

  set value(entries: readonly string[]) {
    this.#entries = entries.map(toEntry);
    if (this.isConnected) {
      this.render();
    }
  }

  /** Newest first, as the API answers them; rows without a date are left out. */
  get value(): Iso8601DateTime[] {
    const entries = this.isConnected ? this.#read() : this.#entries;
    return entries
      .map(isoOf)
      .filter((entry): entry is Iso8601DateTime => entry !== null)
      .toSorted((a, b) => b.localeCompare(a));
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.root.addEventListener('input', (event) => {
      event.stopPropagation();
      this.#changed();
    });
    this.root.addEventListener('change', (event) => {
      event.stopPropagation();
      this.#changed();
    });
  }

  override languageChanged(): void {
    this.#rerender();
  }

  override handleAction(action: string, element: HTMLElement): void {
    const entries = this.#read();
    if (action === 'add') {
      entries.unshift(toLocalParts(new Date().toISOString()));
    } else if (action === 'remove') {
      entries.splice(Number(element.dataset.index), 1);
    } else {
      return;
    }
    this.#entries = entries;
    this.render();
    this.#changed();
  }

  #changed(): void {
    this.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
  }

  #rerender(): void {
    this.#entries = this.#read();
    this.render();
  }

  #read(): Entry[] {
    if (this.$('[data-testid="add"]') === null) {
      return [...this.#entries];
    }
    return this.$$<HTMLElement>('[data-testid="entry"]').map((row) => ({
      date: row.querySelector<HTMLInputElement>('input[type="date"]')?.value ?? '',
      time: row.querySelector<HTMLInputElement>('input[type="time"]')?.value ?? '',
      ...(row.dataset.original === undefined ? {} : { original: row.dataset.original }),
    }));
  }

  override template(): RawHtml {
    const l = t();
    return html`
      <fieldset class="vstack gap-2">
        <legend>${this.getAttribute('label') ?? ''}</legend>
        <ol class="unstyled vstack gap-2" data-testid="entries">
          ${this.#entries.map((entry, i) => {
            const label = l.recipe.form.historyEntry(i + 1);
            return html`<li class="entry" data-testid="entry" ${entry.original === undefined ? '' : html`data-original="${entry.original}"`}>
              <input type="date" value="${entry.date}" aria-label="${label}: ${l.recipe.form.date}" data-testid="date-${i}" />
              <input type="time" value="${entry.time}" aria-label="${label}: ${l.recipe.form.time}" data-testid="time-${i}" />
              <button
                type="button"
                class="outline icon"
                data-variant="danger"
                data-action="remove"
                data-index="${i}"
                aria-label="${l.recipe.form.remove}: ${label}"
              >
                ×
              </button>
            </li>`;
          })}
        </ol>
        <div><button type="button" class="outline" data-action="add" data-testid="add">+ ${l.recipe.form.addHistoryEntry}</button></div>
      </fieldset>
    `;
  }
}

await define('pr-history-field', PrHistoryFieldComponent, import.meta.url);
