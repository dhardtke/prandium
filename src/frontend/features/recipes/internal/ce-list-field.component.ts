import type { RawHtml } from '../../../ui/html.ts';
import { define, CeElement } from '../../../ui/base.ts';
import { html } from '../../../ui/html.ts';
import { t } from '../../../ui/i18n.ts';

/**
 * An editable list of lines: add, remove, up and down. `multiline` makes each a textarea.
 * Emits `input` whenever the list changes. The DOM holds the truth while editing; `value` reads it back.
 */
export class CeListFieldComponent extends CeElement {
  static observedAttributes = ['multiline', 'label', 'add-label', 'maxlength'];

  #items: string[] = [];
  // Labels such as "Ingredient 3"; set by the owner because the strings live in its dictionary keys.
  #itemLabel: (n: number) => string = (n) => String(n);

  attributeChangedCallback(): void {
    if (this.isConnected) {
      this.#rerender();
    }
  }

  set itemLabel(label: (n: number) => string) {
    this.#itemLabel = label;
  }

  set value(items: readonly string[]) {
    this.#items = [...items];
    if (this.isConnected) {
      this.render();
    }
  }

  get value(): string[] {
    return this.isConnected ? this.#read() : [...this.#items];
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.root.addEventListener('input', (event) => {
      event.stopPropagation();
      this.#changed();
    });
  }

  // Entered text survives a language change.
  override languageChanged(): void {
    this.#rerender();
  }

  override handleAction(action: string, element: HTMLElement): void {
    const items = this.#read();
    const index = Number(element.dataset.index);
    let focus: string | null = null;
    if (action === 'add') {
      items.push('');
      focus = `[data-index="${items.length - 1}"][data-field]`;
    } else if (action === 'remove') {
      items.splice(index, 1);
    } else if ((action === 'up' && index > 0) || (action === 'down' && index < items.length - 1)) {
      const target = action === 'up' ? index - 1 : index + 1;
      [items[index], items[target]] = [items[target] ?? '', items[index] ?? ''];
      focus = `[data-action="${action}"][data-index="${target}"]`;
    } else {
      return;
    }
    this.#items = items;
    this.render();
    if (focus !== null) {
      this.$<HTMLElement>(focus)?.focus();
    }
    this.#changed();
  }

  #changed(): void {
    this.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
  }

  #rerender(): void {
    this.#items = this.#read();
    this.render();
  }

  #read(): string[] {
    const fields = this.$$<HTMLInputElement | HTMLTextAreaElement>('[data-field]');
    return fields.length === 0 && this.$('[data-testid="add"]') === null ? [...this.#items] : fields.map((field) => field.value);
  }

  override template(): RawHtml {
    const l = t();
    const multiline = this.hasAttribute('multiline');
    const maxlength = this.getAttribute('maxlength') ?? '5000';
    const last = this.#items.length - 1;
    return html`
      <fieldset class="vstack gap-2">
        <legend>${this.getAttribute('label') ?? ''}</legend>
        <ol class="items unstyled vstack gap-2" data-testid="items">
          ${this.#items.map((item, i) => {
            const label = this.#itemLabel(i + 1);
            return html`<li class="item" data-testid="item">
              ${
                multiline
                  ? html`<textarea rows="3" maxlength="${maxlength}" aria-label="${label}" data-field data-index="${i}" data-testid="field-${i}">
${item}</textarea>`
                  : html`<input
                      type="text"
                      maxlength="${maxlength}"
                      aria-label="${label}"
                      value="${item}"
                      data-field
                      data-index="${i}"
                      data-testid="field-${i}"
                    />`
              }
              <div class="buttons hstack gap-1">
                <button type="button" class="outline icon" data-action="up" data-index="${i}" aria-label="${l.up}: ${label}" ${i === 0 ? 'disabled' : ''}>
                  ↑
                </button>
                <button
                  type="button"
                  class="outline icon"
                  data-action="down"
                  data-index="${i}"
                  aria-label="${l.down}: ${label}"
                  ${i === last ? 'disabled' : ''}
                >
                  ↓
                </button>
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
              </div>
            </li>`;
          })}
        </ol>
        <div><button type="button" class="outline" data-action="add" data-testid="add">+ ${this.getAttribute('add-label') ?? ''}</button></div>
      </fieldset>
    `;
  }
}

await define('ce-list-field', CeListFieldComponent, import.meta.url);
