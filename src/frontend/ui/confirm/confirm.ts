import type { ConfirmOptions } from './ce-confirm-dialog.component.ts';
import { CeConfirmDialogComponent } from './ce-confirm-dialog.component.ts';

export type { ConfirmOptions };

// Resolves `true` only for the action button; Cancel, Escape and the backdrop resolve `false`.
export function confirmAction(options: ConfirmOptions): Promise<boolean> {
  const dialog = document.createElement('ce-confirm-dialog');
  if (!(dialog instanceof CeConfirmDialogComponent)) {
    return Promise.reject(new Error('ce-confirm-dialog is not defined'));
  }
  dialog.options = options;
  return dialog.open();
}
