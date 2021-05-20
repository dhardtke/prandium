const LocalStorageName = "COOK_GUIDE_DARK_MODE";
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
    if (document.documentElement.classList.toggle(DocumentClassName, localStorage.getItem(LocalStorageName) === "true")) {
      $inactive?.classList.add("d-none");
    } else {
      $active?.classList.add("d-none");
    }
  };
  toggleDarkMode();

  $darkModeSwitcher.addEventListener("click", (e) => {
    e.preventDefault();

    localStorage.setItem(LocalStorageName, localStorage.getItem("COOK_GUIDE_DARK_MODE") === "true" ? "false" : "true");
    toggleDarkMode();
  });
}
