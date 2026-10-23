import { raw } from './html.ts';
import type { RawHtml } from './html.ts';
import { onLanguageChange } from './i18n.ts';
import { loadStyles, stylesFor } from './styles.ts';

export class PrElement extends HTMLElement {
  readonly root: ShadowRoot;
  #stopLanguageSync: (() => void) | null = null;

  constructor() {
    super();
    this.root = this.attachShadow({ mode: 'open' });
    this.root.adoptedStyleSheets = stylesFor(this.localName);

    this.root.addEventListener('click', (event) => {
      const target = event.target instanceof Element ? event.target.closest('[data-action]') : null;
      if (target instanceof HTMLElement && target.dataset.action) {
        void this.handleAction(target.dataset.action, target, event);
      }
    });

    this.root.addEventListener('submit', (event) => {
      const form = event.target instanceof Element ? event.target.closest('form[data-action]') : null;
      if (!(form instanceof HTMLFormElement) || !form.dataset.action) {
        return;
      }
      event.preventDefault();
      void this.handleSubmit(form.dataset.action, form, event);
    });
  }

  connectedCallback(): void {
    this.#stopLanguageSync ??= onLanguageChange(() => {
      this.languageChanged();
    });
    this.render();
  }

  disconnectedCallback(): void {
    this.#stopLanguageSync?.();
    this.#stopLanguageSync = null;
  }

  // Every template reads its strings from t(); a component holding state the DOM must keep overrides this.
  languageChanged(): void {
    this.render();
  }

  template(): RawHtml {
    return raw('');
  }

  render(): void {
    this.root.innerHTML = String(this.template());
    this.afterRender();
  }

  afterRender(): void {}

  handleAction(_action: string, _element: HTMLElement, _event: Event): void | Promise<void> {}

  handleSubmit(_action: string, _form: HTMLFormElement, _event: Event): void | Promise<void> {}

  // Once-used type parameter on purpose, as querySelector's: callers know their own markup.
  // oxlint-disable-next-line typescript/no-unnecessary-type-parameters
  $<T extends Element = Element>(selector: string): T | null {
    return this.root.querySelector<T>(selector);
  }

  $$<T extends Element = Element>(selector: string): T[] {
    return Array.from(this.root.querySelectorAll<T>(selector));
  }

  emit(name: string, detail?: unknown): void {
    this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
  }

  formData(form: HTMLFormElement): Record<string, string> {
    const values: Record<string, string> = {};
    for (const [key, value] of new FormData(form).entries()) {
      if (typeof value === 'string') {
        values[key] = value.trim();
      }
    }
    return values;
  }
}

export async function define(name: string, ctor: CustomElementConstructor, moduleUrl: string): Promise<void> {
  if (customElements.get(name)) {
    return;
  }
  await loadStyles(name, moduleUrl);
  if (!customElements.get(name)) {
    customElements.define(name, ctor);
  }
}
