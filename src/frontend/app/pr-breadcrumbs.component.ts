import type { RawHtml } from '../ui/html.ts';
import { define, PrElement } from '../ui/base.ts';
import { html } from '../ui/html.ts';
export interface Trail {
  parents: readonly { path: string; label: string }[];
  current: string;
}

export class PrBreadcrumbsComponent extends PrElement {
  #trail: Trail | null = null;

  get trail(): Trail | null {
    return this.#trail;
  }

  set trail(trail: Trail | null) {
    this.#trail = trail;
    this.hidden = trail === null;
    this.render();
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.hidden = this.#trail === null;
  }

  override template(): RawHtml {
    if (!this.#trail) {
      return html``;
    }
    return html`
      <nav aria-label="Breadcrumb" data-testid="breadcrumb">
        <ol class="unstyled">
          ${this.#trail.parents.map((parent) => html`<li><a class="unstyled" href="${parent.path}" data-testid="crumb">${parent.label}</a></li>`)}
          <li><span aria-current="page" data-testid="current">${this.#trail.current}</span></li>
        </ol>
      </nav>
    `;
  }
}

await define('pr-breadcrumbs', PrBreadcrumbsComponent, import.meta.url);
