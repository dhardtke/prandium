import type { RawHtml } from '../ui/html.ts';
import { define, PrElement } from '../ui/base.ts';
import { PrView, PAGE_TITLE_EVENT } from '../ui/view.ts';
import { html } from '../ui/html.ts';
import { currentPath, linkPath, matchRoute, navigate, onRouteChange } from './router.ts';
import type { RouteDef, RouteMatch } from './router.ts';
import { ROUTES } from './routes.ts';
import { tabTitle } from './tab-title.ts';
import { toastError } from '../ui/toast.ts';
import { UNAUTHORIZED_EVENT } from '../http/errors.ts';
import { t } from '../ui/i18n.ts';
import { confirmLeave, hasUnsavedChanges } from '../ui/leave-guard.ts';
import type { PrBreadcrumbsComponent } from './pr-breadcrumbs.component.ts';
import './pr-breadcrumbs.component.ts';
import './pr-header.component.ts';

const SLOW_VIEW_MS = 300;

// Views live in light DOM (slotted): password managers do not search shadow roots.
class PrAppComponent extends PrElement {
  #unsubscribe: (() => void) | null = null;
  #renderToken = 0;
  #shown: { route: RouteDef | null; view: Element } | null = null;
  #shownUrl = '';

  readonly #onUnauthorized = (): void => {
    if (currentPath() !== '/login') {
      navigate(`/login?next=${encodeURIComponent(location.pathname + location.search)}`);
    }
  };

  constructor() {
    super();
    this.addEventListener('click', (event) => {
      // Shadow roots retarget event.target to the host; composedPath() still holds the anchor.
      const anchor = event.composedPath().find((target): target is HTMLAnchorElement => target instanceof HTMLAnchorElement);
      if (!anchor) {
        return;
      }
      const path = linkPath(event, { href: anchor.href, target: anchor.target, download: anchor.hasAttribute('download') }, location.origin);
      if (path === null) {
        return;
      }
      event.preventDefault();
      void this.#follow(path);
    });
    this.addEventListener(PAGE_TITLE_EVENT, (event) => {
      if (event.target === this.#shown?.view) {
        this.#showPage();
      }
    });
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.#unsubscribe = onRouteChange(() => {
      void this.#onRouteChange();
    });
    window.addEventListener(UNAUTHORIZED_EVENT, this.#onUnauthorized);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.#unsubscribe?.();
    window.removeEventListener(UNAUTHORIZED_EVENT, this.#onUnauthorized);
  }

  override afterRender(): void {
    this.#renderView();
  }

  async #follow(path: string): Promise<void> {
    if (await confirmLeave()) {
      navigate(path);
    }
  }

  // Back and Forward have moved the URL already, so declining puts the shown page's URL back.
  async #onRouteChange(): Promise<void> {
    const url = location.pathname + location.search;
    if (this.#shownUrl !== '' && url !== this.#shownUrl && hasUnsavedChanges() && !(await confirmLeave())) {
      history.pushState(null, '', this.#shownUrl);
      return;
    }
    this.#renderView();
  }

  // Re-rendering would rebuild the view; the header, the breadcrumbs and the views re-render themselves.
  override languageChanged(): void {
    this.#showPage();
  }

  async #viewElement(path: string): Promise<{ match: RouteMatch | null; view: Element }> {
    const match = matchRoute(ROUTES, path);
    if (match) {
      return { match, view: await match.route.view(match.params) };
    }

    const view = document.createElement('p');
    view.className = 'empty';
    view.dataset.testid = 'not-found';
    view.dataset.path = path;
    view.textContent = t().notFound(path);
    return { match, view };
  }

  #renderView(): void {
    // navigate() dispatches popstate for the current path too, so this runs re-entrantly.
    const token = ++this.#renderToken;

    void this.#swapView(currentPath(), token);
  }

  async #swapView(path: string, token: number): Promise<void> {
    let match: RouteMatch | null;
    let view: Element;
    try {
      ({ match, view } = await this.#viewElement(path));
    } catch (cause) {
      toastError(cause);
      return;
    }

    if (token !== this.#renderToken || !this.isConnected) {
      return;
    }

    // A PrView loads once connected, so it is connected hidden and revealed when ready.
    if (view instanceof PrView) {
      view.hidden = true;
      this.append(view);
      const slow = new Promise<void>((resolve) => {
        setTimeout(resolve, SLOW_VIEW_MS);
      });
      await Promise.race([view.ready, slow]);
      if (token !== this.#renderToken || !view.isConnected) {
        view.remove();
        return;
      }
    }

    // Not replaceChildren: moving a connected view would reconnect it, and it would load again.
    for (const child of Array.from(this.children)) {
      if (child !== view) {
        child.remove();
      }
    }
    if (view.parentNode !== this) {
      this.append(view);
    }
    view.removeAttribute('hidden');
    this.#shown = { route: match?.route ?? null, view };
    this.#shownUrl = location.pathname + location.search;
    this.#showPage();
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  #showPage(): void {
    if (!this.#shown) {
      return;
    }
    const { route, view } = this.#shown;
    const viewTitle = view instanceof PrView ? view.pageTitle : null;
    const name = route ? (viewTitle ?? route.title?.(t()) ?? null) : t().error[404].title;
    document.title = tabTitle(name);
    if (view instanceof HTMLElement && view.dataset.testid === 'not-found') {
      view.textContent = t().notFound(view.dataset.path ?? '');
    }
    const breadcrumbs = this.$<PrBreadcrumbsComponent>('pr-breadcrumbs');
    if (breadcrumbs) {
      const parents =
        (view instanceof PrView ? view.pageParents : null) ?? (route?.parents ?? []).map((parent) => ({ path: parent.path, label: parent.label(t()) }));
      breadcrumbs.trail = parents.length > 0 ? { parents, current: name ?? '' } : null;
    }
  }

  override template(): RawHtml {
    return html`
      <pr-header data-testid="header"></pr-header>

      <main class="container"><pr-breadcrumbs data-testid="breadcrumbs"></pr-breadcrumbs><slot data-testid="view-slot"></slot></main>
    `;
  }
}

await define('pr-app', PrAppComponent, import.meta.url);
