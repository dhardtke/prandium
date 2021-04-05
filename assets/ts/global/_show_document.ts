// Prevent FOUC by showing document after styles have been applied
export function showDocument() {
  document.documentElement.style.display = "";
}
