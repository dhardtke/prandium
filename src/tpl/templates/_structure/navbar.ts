// deno-fmt-ignore-file
import { parameters } from "../../../http/util/parameters.ts";
import { l, Language, LANGUAGES } from "../../../i18n/mod.ts";
import { e, html } from "../../mod.ts";
import { Icon, IconName } from "../_components/icon.ts";
import { Page } from "./page.ts";

const LanguageDropdownItem = (lang: Language) => html`
  <div class="d-flex">
    <span class="me-2">${lang.meta.flag}</span>
    ${l.meta.labels[lang.meta.id]}
  </div>
`;

const LanguageDropdown = () => html`
  <a class="nav-link inactive dropdown-toggle" data-bs-toggle="dropdown" href="#">
    ${Icon("globe", "mx-auto mb-1")}
    ${l.language}
  </a>
  <ul class="dropdown-menu dropdown-menu-end">
    ${Object.entries(LANGUAGES).map(([id, lang]) => l.meta.id === id
      ? html`
        <li class="dropdown-item text-center active">${LanguageDropdownItem(lang)}</li>`
      : html`
        <li><a class="dropdown-item text-center" href="${parameters(Page.currentUrl).set("lang", lang.meta.id)}">
          ${LanguageDropdownItem(lang)}
        </a></li>`)}
  </ul>
`;

function Menu() {
  const items: {
    url: string,
    label: string,
    icon: IconName
  }[] = [
    {
      url: "/",
      label: l.recipes,
      icon: "house-door"
    }, {
      url: "/statistics",
      label: "Statistics", // TODO
      icon: "bar-chart"
    }
  ];
  return html`
    ${items.map((item) => ({ item, active: Page.currentUrl.pathname === item.url }))
      .map(({ item, active }) => html`
        <li>
          <a class="nav-link ${active ? "active" : "inactive"}" ${!active && ` href="${item.url}"`}>
            ${Icon(item.icon, "mx-auto mb-1")}
            ${item.label}
          </a>
        </li>
      `)}
  `;
}

export const Navbar = () => html`
  <header>
    <div class="px-3 py-2">
      <div class="container-xxl">
        <div class="d-flex flex-wrap align-items-center justify-content-center">
          <a href="/" class="navbar-brand d-flex align-items-center justify-content-center my-2">
            <div class="text-info me-2 d-flex">
              ${Icon("journal-richtext")}
            </div>
            <div class="app-name">
              ${e(l.appName)}
            </div>
          </a>

          <ul class="nav col-auto my-2 justify-content-center">
            ${Menu()}
          </ul>
          <ul class="nav col-auto my-2 justify-content-center">
            <li>
              <a class="nav-link inactive" id="dark-mode-switcher" href="#">
                ${Icon("sun-fill", "active d-none mx-auto mb-1 text-warning")}
                ${Icon("moon", "inactive mx-auto mb-1 text-secondary")}
                ${l.darkMode}
              </a>
            </li>
            <li class="nav-item dropdown" id="language-dropdown">
              ${LanguageDropdown()}
            </li>
          </ul>
        </div>
      </div>
    </div>
  </header>
`;
