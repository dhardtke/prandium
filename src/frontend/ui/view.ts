import { ApiError, errorMessage } from '../http/errors.ts';
import { PrElement } from './base.ts';
import { html } from './html.ts';
import type { RawHtml } from './html.ts';
import { t } from './i18n.ts';
import { toastError } from './toast.ts';

export const PAGE_TITLE_EVENT = 'page-title';

export type ViewState<Data> = { status: 'loading' } | { status: 'ready'; data: Data } | { status: 'error'; message: string };

export abstract class PrView<Data> extends PrElement {
  ready: Promise<void> = Promise.resolve();

  #state: ViewState<Data> = { status: 'loading' };

  get loadingText(): string {
    return t().loading;
  }

  get data(): Data | undefined {
    return this.#state.status === 'ready' ? this.#state.data : undefined;
  }

  titleFor(_data: Data): string | null {
    return null;
  }

  get pageTitle(): string | null {
    return this.#state.status === 'ready' ? this.titleFor(this.#state.data) : null;
  }

  abstract load(): Promise<Data>;

  abstract readyTemplate(data: Data): RawHtml;

  errorTemplate(message: string): RawHtml {
    return html`<p class="error-text" data-testid="error">${message}</p>`;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.ready = this.reload();
  }

  // Never rejects: pr-app awaits `ready` before swapping views in.
  async reload(): Promise<void> {
    let data: Data;
    try {
      data = await this.load();
    } catch (error) {
      this.#state = { status: 'error', message: errorMessage(error) };
      if (!(error instanceof ApiError) || error.status !== 404) {
        toastError(error);
      }
      this.render();
      this.emit(PAGE_TITLE_EVENT);
      return;
    }
    this.show(data);
  }

  // For data a mutation's response already carries, so it needs no reload.
  show(data: Data): void {
    this.#state = { status: 'ready', data };
    this.render();
    this.emit(PAGE_TITLE_EVENT);
  }

  // For a change the view patches into its DOM itself, so the field being typed in is never replaced.
  replaceData(data: Data): void {
    this.#state = { status: 'ready', data };
    this.emit(PAGE_TITLE_EVENT);
  }

  override template(): RawHtml {
    if (this.#state.status === 'loading') {
      return html`<p aria-busy="true" data-testid="loading">${this.loadingText}</p>`;
    }
    if (this.#state.status === 'error') {
      return this.errorTemplate(this.#state.message);
    }
    return this.readyTemplate(this.#state.data);
  }

  // Routes match ids as `(\d+)`, so this cannot produce NaN.
  numericAttribute(name: string): number {
    const value = this.getAttribute(name);
    if (value === null) {
      throw new Error(`${this.localName} needs a ${name} attribute`);
    }
    return Number(value);
  }
}
