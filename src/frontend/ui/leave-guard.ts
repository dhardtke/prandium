import { confirmAction } from './confirm/confirm.ts';
import { t } from './i18n.ts';

const guards = new Set<() => boolean>();

const onBeforeUnload = (event: BeforeUnloadEvent): void => {
  if (hasUnsavedChanges()) {
    event.preventDefault();
  }
};

/** While `isDirty()` holds, closing the tab asks the browser's question and an in-app navigation asks ours. Returns the release. */
export function guardLeave(isDirty: () => boolean): () => void {
  if (guards.size === 0) {
    window.addEventListener('beforeunload', onBeforeUnload);
  }
  guards.add(isDirty);
  return () => {
    guards.delete(isDirty);
    if (guards.size === 0) {
      window.removeEventListener('beforeunload', onBeforeUnload);
    }
  };
}

export function hasUnsavedChanges(): boolean {
  return [...guards].some((isDirty) => isDirty());
}

/** Resolves true at once without unsaved changes; once confirmed, the guards stop asking, so the navigation that follows goes through. */
export async function confirmLeave(): Promise<boolean> {
  if (!hasUnsavedChanges()) {
    return true;
  }
  const l = t();
  const confirmed = await confirmAction({ title: l.leave.title, message: l.leave.message, confirmLabel: l.leave.discard, danger: true });
  if (confirmed) {
    guards.clear();
    window.removeEventListener('beforeunload', onBeforeUnload);
  }
  return confirmed;
}
