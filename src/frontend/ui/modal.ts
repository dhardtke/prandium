import { PrElement } from './base.ts';

export abstract class PrModal<Answer> extends PrElement {
  #resolve: ((answer: Answer) => void) | null = null;

  abstract answer(dialog: HTMLDialogElement): Answer;

  // Appends the modal to the body and resolves its answer once the dialog closes, however it closes.
  open(): Promise<Answer> {
    const answer = new Promise<Answer>((resolve) => {
      this.#resolve = resolve;
    });
    document.body.append(this);
    return answer;
  }

  override afterRender(): void {
    const dialog = this.$<HTMLDialogElement>('dialog');
    if (!dialog) {
      return;
    }
    // Oat's touch shim listens on `document`, where this shadow root's clicks name the host instead.
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) {
        dialog.close();
      }
    });
    dialog.addEventListener('close', () => {
      this.#resolve?.(this.answer(dialog));
      this.remove();
    });
    dialog.showModal();
  }
}
