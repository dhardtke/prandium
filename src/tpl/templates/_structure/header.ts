// deno-fmt-ignore-file
import { parameters } from "../../../http/util/parameters.ts";
import { l, Language, LANGUAGES } from "../../../i18n/mod.ts";
import { e, html } from "../../mod.ts";
import { Collapsible } from "../_components/collapsible.ts";
import { Icon, IconName } from "../_components/icon.ts";
import { Page } from "./page.ts";

const LanguageDropdownItem = (lang: Language) => html`
  ${lang.meta.flag}${l.meta.labels[lang.meta.id]}
`;

const LanguageDropdown = () => html`
  ${Collapsible({
    label: html`${Icon("globe")}${l.language}`,
    content: html`
      <ul class="dropdown">
        ${Object.entries(LANGUAGES).map(([id, lang]) => l.meta.id === id
          ? html`
            <li class="item active">${LanguageDropdownItem(lang)}</li>`
          : html`
            <li><a class="item" href="${parameters(Page.currentUrl).set("lang", lang.meta.id)}">
              ${LanguageDropdownItem(lang)}
            </a></li>`)}
      </ul>`,
  })}
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
        <li class="nav-item${active && " active"}">
          ${active ?
            html`${Icon(item.icon)}${item.label}` :
            html`<a href="${item.url}">
              ${Icon(item.icon)}${item.label}
            </a>`}
        </li>
      `)}
  `;
}

export const Header = () => html`
  <header>
    <div class="container header-inner">
      <a href="/" class="app">
        <div class="app-icon">
          ${Icon("journal-richtext")}
        </div>
        <div class="app-name">
          ${e(l.appName)}
        </div>
      </a>

      <ul class="nav">
        ${Menu()}
      </ul>
      <ul class="nav">
        <li class="nav-item" id="dark-mode-switcher">
          <span class="active${!Page.dark && " hidden"}">
            ${Icon("sun-fill")}${l.lightMode}
          </span>
          <span class="inactive${Page.dark && " hidden"}">
            ${Icon("moon")}${l.darkMode}
          </span>
        </li>
        <li class="nav-item nav-item-collapsible" id="language-dropdown">
          ${LanguageDropdown()}
        </li>
      </ul>
    </div>
  </header>
`;
