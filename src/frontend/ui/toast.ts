import { ApiError, errorMessage } from '../http/errors.ts';

export type ToastKind = 'info' | 'success' | 'error';

declare global {
  interface Window {
    // index.html loads oat.js, deferred, before any module runs.
    ot: {
      toast: (message: string, title?: string, options?: { variant?: string; placement?: string; duration?: number }) => HTMLElement;
    };
  }
}

export function toast(message: string, kind: ToastKind = 'info'): void {
  window.ot.toast(message, undefined, {
    variant: kind === 'error' ? 'danger' : kind,
    placement: 'bottom-right',
    duration: kind === 'error' ? 6000 : 3000,
  });
}

export function toastError(error: unknown): void {
  // ce-app sends the user to the login page instead.
  if (error instanceof ApiError && error.status === 401) {
    return;
  }
  toast(errorMessage(error), 'error');
}
