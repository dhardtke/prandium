const LocalStorageName = "PRANDIUM_DARK_MODE";
const DocumentClassName = "dark";

export function NavbarDarkModeSwitcher() {
  const $darkModeSwitcher = document.getElementById("dark-mode-switcher");
  if (!$darkModeSwitcher) {
    return;
  }
  const $active = $darkModeSwitcher.querySelector(".active");
  const $inactive = $darkModeSwitcher.querySelector(".inactive");
  const toggleDarkMode = () => {
    $active?.classList.remove("d-none");
    $inactive?.classList.remove("d-none");

    let storage = localStorage.getItem(LocalStorageName);
    if (storage === null) {
      storage = window.matchMedia("(prefers-color-scheme: dark)").matches ? "true" : "";
    }

    if (document.documentElement.classList.toggle(DocumentClassName, storage === "true")) {
      $inactive?.classList.add("d-none");
    } else {
      $active?.classList.add("d-none");
    }
  };
  toggleDarkMode();

  $darkModeSwitcher.addEventListener("click", (e) => {
    e.preventDefault();

    localStorage.setItem(LocalStorageName, localStorage.getItem("PRANDIUM_DARK_MODE") === "true" ? "false" : "true");
    toggleDarkMode();
  });
}
