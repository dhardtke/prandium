export function registerOnPopstateListener() {
  window.addEventListener("popstate", () => {
    window.location.reload();
  });
}
