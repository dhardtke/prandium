// deno-fmt-ignore-file
import { setParameter } from "../../../http/util/parameters.ts";
import { l, Language, LANGUAGES } from "../../../i18n/mod.ts";
import { e, html } from "../../mod.ts";
import { Icon } from "../_components/icon.ts";
import { Page } from "./page.ts";

const LanguageDropdownItem = (lang: Language) => html`
  <div class="d-flex">
    <span class="me-2">${lang.meta.flag}</span>
    ${l.meta.labels[lang.meta.id]}
  </div>
`;

const LanguageDropdown = () => html`
  <div class="dropdown ms-2" id="language-dropdown">
    <button class="btn btn-sm btn-outline-primary h-100 dropdown-toggle" data-bs-toggle="dropdown">
      ${Icon("globe")}
    </button>
    <ul class="dropdown-menu">
      ${Object.entries(LANGUAGES).map(([id, lang]) => l.meta.id === id
        ? html`
          <li class="dropdown-item text-center active">${LanguageDropdownItem(lang)}</li>`
        : html`
          <li><a class="dropdown-item text-center" href="${setParameter(Page.currentUrl!, "lang", lang.meta.id)}">
            ${LanguageDropdownItem(lang)}
          </a></li>`)}
    </ul>
  </div>
`;

export const Navbar = () => html`
  <nav class="navbar navbar-expand-md navbar-dark fixed-top">
    <div class="container-xxl">
      <a class="navbar-brand" href="/">
        <div class="d-flex align-items-center">
          <div class="text-info me-2 d-flex">
            ${Icon("journal-richtext")}
          </div>
          <div class="app-name">
            ${e(l.appName)}
          </div>
        </div>
      </a>

      <div class="d-flex">
        <button id="dark-mode-switcher" type="button" class="btn btn-sm btn-outline-light h-100">
          <span class="active d-none">
            ${Icon("sun-fill")}
          </span>
          <span class="inactive">
            ${Icon("moon")}
          </span>
        </button>

        ${LanguageDropdown()}
      </div>
    </div>
  </nav>
`;
