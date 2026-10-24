import type { RawHtml } from '../ui/html.ts';
import { define, CeElement } from '../ui/base.ts';
import { html } from '../ui/html.ts';
import { t } from '../ui/i18n.ts';
import { currentTheme, onThemeChange, toggleTheme } from '../ui/theme.ts';

class CeThemeToggleComponent extends CeElement {
  #stopThemeSync: (() => void) | null = null;

  override connectedCallback(): void {
    super.connectedCallback();
    this.#stopThemeSync = onThemeChange(() => {
      this.#syncIcon();
    });
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.#stopThemeSync?.();
    this.#stopThemeSync = null;
  }

  override afterRender(): void {
    this.#syncIcon();
  }

  // In place rather than re-rendering, so the button keeps focus across its own click.
  #syncIcon(): void {
    const dark = currentTheme() === 'dark';
    this.$('svg.sun')?.toggleAttribute('hidden', dark);
    this.$('svg.moon')?.toggleAttribute('hidden', !dark);
    this.$('button')?.setAttribute('aria-label', dark ? t().theme.turnOffDark : t().theme.turnOnDark);
  }

  override handleAction(action: string): void {
    if (action === 'toggle-theme') {
      toggleTheme();
    }
  }

  override template(): RawHtml {
    return html`
      <button type="button" class="ghost icon" data-action="toggle-theme" data-testid="toggle">
        <svg
          class="sun"
          data-testid="sun"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
        <svg
          class="moon"
          data-testid="moon"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
        </svg>
      </button>
    `;
  }
}

await define('ce-theme-toggle', CeThemeToggleComponent, import.meta.url);
