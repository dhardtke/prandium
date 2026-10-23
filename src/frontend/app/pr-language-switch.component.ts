import type { RawHtml } from '../ui/html.ts';
import { define, PrElement } from '../ui/base.ts';
import { html } from '../ui/html.ts';
import { LANGUAGE_IDS, LANGUAGES, language, setLanguage } from '../ui/i18n.ts';
import type { LanguageId } from '../i18n/language.ts';

class PrLanguageSwitchComponent extends PrElement {
  override handleAction(action: string, element: HTMLElement): void {
    const id = element.dataset.language;
    // The re-render the change triggers replaces the open menu with a closed one.
    if (action === 'language' && (id === 'en' || id === 'de')) {
      setLanguage(id satisfies LanguageId);
    }
  }

  override template(): RawHtml {
    const current = language();
    return html`
      <ot-dropdown>
        <button type="button" class="ghost" popovertarget="language-menu" aria-label="${current.language}: ${current.meta.name}" data-testid="toggle">
          ${current.meta.name}
        </button>
        <menu popover id="language-menu" data-testid="menu">
          ${LANGUAGE_IDS.map(
            (id) =>
              html`<button
                type="button"
                role="menuitemradio"
                lang="${id}"
                aria-checked="${id === current.meta.id ? 'true' : 'false'}"
                data-action="language"
                data-language="${id}"
                data-testid="language-${id}"
              >
                ${LANGUAGES[id].meta.name}
              </button>`,
          )}
        </menu>
      </ot-dropdown>
    `;
  }
}

await define('pr-language-switch', PrLanguageSwitchComponent, import.meta.url);
