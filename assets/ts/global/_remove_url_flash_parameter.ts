// The query parameter "flash" is used to send context information e.g. about a successful operation to the template after the action has occurred.
export function removeUrlFlashParameter() {
  const url = new URL(window.location.href);
  url.searchParams.delete("flash");
  window.history.replaceState({}, document.title, url.toString());
}
