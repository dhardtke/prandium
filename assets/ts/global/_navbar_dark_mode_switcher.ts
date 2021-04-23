export function NavbarDarkModeSwitcher() {
  const LOCAL_STORAGE_NAME = "COOK_GUIDE_DARK_MODE";
  const DOCUMENT_CLASS_NAME = "dark";

  const $darkModeSwitcher = document.getElementById("dark-mode-switcher");
  if (!$darkModeSwitcher) {
    return;
  }
  const $active = $darkModeSwitcher.querySelector(".active");
  const $inactive = $darkModeSwitcher.querySelector(".inactive");
  const toggleDarkMode = () => {
    $active?.classList.remove("d-none");
    $inactive?.classList.remove("d-none");
    if (document.documentElement.classList.toggle(DOCUMENT_CLASS_NAME, localStorage.getItem(LOCAL_STORAGE_NAME) === "true")) {
      $inactive?.classList.add("d-none");
    } else {
      $active?.classList.add("d-none");
    }
  };
  toggleDarkMode();

  $darkModeSwitcher.addEventListener("click", () => {
    localStorage.setItem(LOCAL_STORAGE_NAME, localStorage.getItem("COOK_GUIDE_DARK_MODE") === "true" ? "false" : "true");
    toggleDarkMode();
  });
}
