/// <reference lib="dom" />
import { DarkModeCookie } from "../../../src/shared/constants.ts";
import { getCookie, setCookie } from "../_util/cookie_util.ts";

const DocumentClassName = "dark";
const HIDDEN_CLASS = "hidden";

export function NavbarDarkModeSwitcher() {
  const $darkModeSwitcher = document.getElementById("dark-mode-switcher");
  if (!$darkModeSwitcher) {
    return;
  }
  const $active = $darkModeSwitcher.querySelector(".active");
  const $inactive = $darkModeSwitcher.querySelector(".inactive");
  const toggleDarkMode = () => {
    $active?.classList.remove(HIDDEN_CLASS);
    $inactive?.classList.remove(HIDDEN_CLASS);

    if (document.documentElement.classList.toggle(DocumentClassName)) {
      $inactive?.classList.add(HIDDEN_CLASS);
    } else {
      $active?.classList.add(HIDDEN_CLASS);
    }
  };

  let storage = getCookie(DarkModeCookie);
  if (storage === null) {
    const wantsDark = "" + globalThis.matchMedia("(prefers-color-scheme: dark)").matches;
    setCookie(DarkModeCookie, wantsDark);
    toggleDarkMode();
  }

  $darkModeSwitcher.addEventListener("click", (e) => {
    e.preventDefault();

    storage = storage === "true" ? "false" : "true";
    setCookie(DarkModeCookie, storage);
    toggleDarkMode();
  });
}
