import type { RawHtml } from '../html.ts';
import { define, CeElement } from '../base.ts';
import { html } from '../html.ts';
import { t } from '../i18n.ts';
import { pageItems } from './pagination.ts';

// Emits `page-change` rather than navigating: ui/ may not import the router.
class CePaginationComponent extends CeElement {
  static observedAttributes = ['page', 'pages'];

  attributeChangedCallback(): void {
    if (this.isConnected) {
      this.render();
    }
  }

  override handleAction(action: string, element: HTMLElement): void {
    if (action === 'page') {
      this.emit('page-change', Number(element.dataset.page));
    }
  }

  override template(): RawHtml {
    const page = Number(this.getAttribute('page') ?? 1);
    const pages = Number(this.getAttribute('pages') ?? 1);
    if (page > pages) {
      return html`
        <div class="vstack">
          <p class="empty" data-testid="empty">${t().pagination.emptyPage}</p>
          <div><button class="outline" data-action="page" data-page="1" data-testid="first-page">${t().pagination.firstPage}</button></div>
        </div>
      `;
    }
    return html`
      <nav aria-label="Pagination" data-testid="pager">
        <menu class="buttons">
          <li>
            <button
              class="outline"
              data-action="page"
              data-page="${page - 1}"
              data-testid="previous"
              ${page <= 1 ? 'disabled' : ''}
              aria-label="${t().pagination.previous}"
            >
              ←
            </button>
          </li>
          ${pageItems(page, pages).map((item) =>
            item === 'gap'
              ? html`<li><button class="outline" disabled aria-hidden="true" data-testid="gap">…</button></li>`
              : item === page
                ? html`<li>
                    <button aria-current="page" data-action="page" data-page="${item}" aria-label="${t().pagination.page(item)}" data-testid="page-${item}">
                      ${item}
                    </button>
                  </li>`
                : html`<li>
                    <button class="outline" data-action="page" data-page="${item}" aria-label="${t().pagination.page(item)}" data-testid="page-${item}">
                      ${item}
                    </button>
                  </li>`,
          )}
          <li>
            <button
              class="outline"
              data-action="page"
              data-page="${page + 1}"
              data-testid="next"
              ${page >= pages ? 'disabled' : ''}
              aria-label="${t().pagination.next}"
            >
              →
            </button>
          </li>
        </menu>
      </nav>
    `;
  }
}

await define('ce-pagination', CePaginationComponent, import.meta.url);
