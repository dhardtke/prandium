export function registerOnPopstateListener() {
  globalThis.addEventListener("popstate", () => {
    globalThis.location.reload();
  });
}
