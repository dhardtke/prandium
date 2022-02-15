// The query parameter "flash" is used to send context information e.g. about a successful operation to the template after the action has occurred.
export function removeUrlFlashParameter() {
  const url = new URL(globalThis.location.href);
  url.searchParams.delete("flash");
  try {
    globalThis.history.replaceState({}, document.title, url.toString());
  } catch {
    // ignore
  }
}
