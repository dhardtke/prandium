import type { RawHtml } from '../ui/html.ts';
import { define, CeElement } from '../ui/base.ts';
import { html } from '../ui/html.ts';
import { LANGUAGE_IDS, LANGUAGES, language, setLanguage } from '../ui/i18n.ts';
import type { LanguageId } from '../i18n/language.ts';

class CeLanguageSwitchComponent extends CeElement {
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
                role="menuitem"
                class="ghost"
                lang="${id}"
                ${id === current.meta.id ? html`aria-current="true"` : ''}
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

await define('ce-language-switch', CeLanguageSwitchComponent, import.meta.url);
