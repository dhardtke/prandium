import type { RawHtml } from '../../ui/html.ts';
import { define, PrElement } from '../../ui/base.ts';
import { html } from '../../ui/html.ts';
import { ApiError, errorMessage } from '../../http/errors.ts';
import { navigate } from '../../app/router.ts';
import { authFacade } from './auth.facade.ts';
import { t } from '../../ui/i18n.ts';
import { nextPath } from './internal/next-path.ts';

// Light-DOM form, not a PrView: password managers skip shadow roots and forms added hidden.
export class PrLoginComponent extends PrElement {
  override connectedCallback(): void {
    super.connectedCallback();
    if (!authFacade.enabled()) {
      navigate(nextPath(location.search, location.origin));
    }
  }

  async #login(form: HTMLFormElement): Promise<void> {
    const button = form.querySelector('button[type="submit"]');
    const input = form.querySelector<HTMLInputElement>('input[name="password"]');
    button?.setAttribute('aria-busy', 'true');
    try {
      await authFacade.login(input?.value ?? '');
      navigate(nextPath(location.search, location.origin));
    } catch (error) {
      this.#showError(error instanceof ApiError && error.status === 401 ? t().login.wrongPassword : errorMessage(error));
      input?.select();
    } finally {
      button?.removeAttribute('aria-busy');
    }
  }

  #showError(message: string): void {
    const alert = this.querySelector<HTMLElement>('[role="alert"]');
    if (alert) {
      alert.textContent = message;
      alert.hidden = false;
    }
  }

  override template(): RawHtml {
    return html`
      <section class="vstack gap-4">
        <h1>${t().login.title}</h1>
        <slot></slot>
      </section>
    `;
  }

  // Own listener: happy-dom does not deliver slotted form events to the shadow root.
  override afterRender(): void {
    this.innerHTML = String(html`
      <form class="vstack gap-2" data-testid="form">
        <input type="text" name="username" autocomplete="username" value="prandium" hidden />
        <label>
          ${t().login.password}
          <input
            type="password"
            name="password"
            placeholder="${t().login.placeholder}"
            autocomplete="current-password"
            required
            autofocus
            data-testid="password"
          />
        </label>
        <div role="alert" data-variant="error" data-testid="alert" hidden></div>
        <button type="submit">${t().login.submit}</button>
      </form>
    `);
    const form = this.querySelector('form');
    form?.addEventListener('submit', (event) => {
      event.preventDefault();
      void this.#login(form);
    });
  }
}

await define('pr-login', PrLoginComponent, import.meta.url);
