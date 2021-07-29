import { DarkModeCookie } from "../../../src/shared/constants.ts";
import { getCookie, setCookie } from "../_util/cookie_util.ts";

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

    if (document.documentElement.classList.toggle(DocumentClassName)) {
      $inactive?.classList.add("d-none");
    } else {
      $active?.classList.add("d-none");
    }
  };

  let storage = getCookie(DarkModeCookie);
  if (storage === null) {
    const wantsDark = "" + window.matchMedia("(prefers-color-scheme: dark)").matches;
    setCookie(DarkModeCookie, wantsDark);
    toggleDarkMode();
  }

  $darkModeSwitcher.addEventListener("click", (e) => {
    e.preventDefault();

    setCookie(DarkModeCookie, storage === "true" ? "false" : "true");
    toggleDarkMode();
  });
}
