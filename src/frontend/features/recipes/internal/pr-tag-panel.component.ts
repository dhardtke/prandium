import type { TagDto } from '../../../../shared/dto/tag.ts';
import type { TagId } from '../../../../shared/flavors.ts';
import type { RawHtml } from '../../../ui/html.ts';
import { define, PrElement } from '../../../ui/base.ts';
import { html } from '../../../ui/html.ts';
import { t } from '../../../ui/i18n.ts';
import { matchesFilter } from './tag-filter.ts';

/** Emits `tag-toggle` (the id), `tags-clear` and `tags-open` (whether the panel is open); its owner decides what they change. */
export class PrTagPanelComponent extends PrElement {
  #tags: TagDto[] = [];
  #selected: readonly TagId[] = [];
  #open = false;
  #filter = '';

  set state(value: { tags: TagDto[]; selected: readonly TagId[]; open: boolean }) {
    this.#tags = value.tags;
    this.#selected = value.selected;
    this.#open = value.open;
    if (this.isConnected) {
      const focused = this.root.activeElement;
      const focusedTag = focused instanceof HTMLElement ? focused.dataset.tagId : undefined;
      const filterFocused = focused instanceof HTMLInputElement;
      this.render();
      // A toggle re-renders the panel; the next click or keystroke lands where the last one did.
      if (focusedTag !== undefined) {
        this.$<HTMLElement>(`[data-tag-id="${focusedTag}"]`)?.focus();
      } else if (filterFocused) {
        this.$<HTMLInputElement>('input[type="search"]')?.focus();
      }
    }
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.root.addEventListener('input', (event) => {
      if (event.target instanceof HTMLInputElement && event.target.type === 'search') {
        this.#filter = event.target.value;
        this.#applyFilter();
      }
    });
  }

  override afterRender(): void {
    this.$('details')?.addEventListener('toggle', (event) => {
      const open = event.target instanceof HTMLDetailsElement && event.target.open;
      if (open !== this.#open) {
        this.#open = open;
        this.emit('tags-open', open);
      }
    });
    this.#applyFilter();
  }

  override handleAction(action: string, element: HTMLElement): void {
    if (action === 'toggle') {
      this.emit('tag-toggle', Number(element.dataset.tagId));
    } else if (action === 'clear') {
      this.emit('tags-clear');
    }
  }

  // Selected tags never hide, so a selection can always be undone.
  #applyFilter(): void {
    for (const button of this.$$<HTMLButtonElement>('button[data-tag-id]')) {
      const selected = button.getAttribute('aria-pressed') === 'true';
      button.hidden = !selected && !matchesFilter(button.dataset.title ?? '', this.#filter);
    }
  }

  override template(): RawHtml {
    const l = t();
    const selected = new Set(this.#selected);
    return html`
      <details data-testid="details" ${this.#open ? 'open' : ''}>
        <summary data-testid="summary">${l.recipe.tagsSelected(selected.size)}</summary>
        <div class="body vstack gap-3">
          <div class="hstack gap-2">
            <input
              type="search"
              class="grow"
              placeholder="${l.navigation.filterPlaceholder}"
              aria-label="${l.navigation.filterTitle}"
              value="${this.#filter}"
              autocomplete="off"
              data-testid="filter"
            />
            <button type="button" class="outline" data-action="clear" data-testid="clear" ${selected.size === 0 ? 'disabled' : ''}>
              ${l.recipe.clearAllTags}
            </button>
          </div>
          ${
            this.#tags.length === 0
              ? html`<p class="text-light" data-testid="no-tags">${l.recipe.noTags}</p>`
              : html`<div class="tags" data-testid="tags">
                  ${this.#tags.map((tag) => {
                    const pressed = selected.has(tag.id);
                    return html`<button
                      type="button"
                      class="${pressed ? '' : 'outline'}"
                      aria-pressed="${pressed ? 'true' : 'false'}"
                      data-action="toggle"
                      data-tag-id="${tag.id}"
                      data-title="${tag.title}"
                      data-testid="tag-${tag.id}"
                      ${!pressed && tag.recipeCount === 0 ? 'disabled' : ''}
                    >
                      ${tag.title} <span class="count">${tag.recipeCount}</span>
                    </button>`;
                  })}
                </div>`
          }
        </div>
      </details>
    `;
  }
}

await define('pr-tag-panel', PrTagPanelComponent, import.meta.url);
