import type { ConfirmOptions } from './pr-confirm-dialog.component.ts';
import { PrConfirmDialogComponent } from './pr-confirm-dialog.component.ts';

export type { ConfirmOptions };

// Resolves `true` only for the action button; Cancel, Escape and the backdrop resolve `false`.
export function confirmAction(options: ConfirmOptions): Promise<boolean> {
  const dialog = document.createElement('pr-confirm-dialog');
  if (!(dialog instanceof PrConfirmDialogComponent)) {
    return Promise.reject(new Error('pr-confirm-dialog is not defined'));
  }
  dialog.options = options;
  return dialog.open();
}
