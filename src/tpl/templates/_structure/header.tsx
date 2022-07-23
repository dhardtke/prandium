/** @jsxImportSource https://esm.sh/preact@10.10.0?pin=v66 */
import { classNames } from "../../../../deps.ts";
import { parameters } from "../../../http/util/parameters.ts";
import { l, Language, LANGUAGES } from "../../../i18n/mod.ts";
import { Dropdown, DropdownItem } from "../_components/dropdown.tsx";
import { Icon, IconName } from "../_components/icon.tsx";
import { Page } from "./page.tsx";

const LanguageDropdownItem = (props: { lang: Language }) => (
  <>
    <span
      dangerouslySetInnerHTML={{
        __html: props.lang.meta.flag,
      }}
    >
    </span>
    {l.meta.labels[props.lang.meta.id]}
  </>
);

const LanguageDropdown = () => (
  <li className="nav-item nav-item-collapsible" id="language-dropdown">
    <Dropdown
      id="collapsible-language-dropdown"
      label={
        <>
          <Icon name="globe" />
          {l.language}
        </>
      }
      spacing={true}
      fullWidthMobile={true}
      caret={true}
    >
      {Object.entries(LANGUAGES)
        .map(([id, lang]) => ({ lang, active: l.meta.id === id }))
        .map((item: { active: boolean; lang: Language }) => (
          <DropdownItem active={item.active}>
            {item.active ? <LanguageDropdownItem lang={item.lang} /> : (
              <a href={parameters(Page.currentUrl).set("lang", item.lang.meta.id).toString()}>
                <LanguageDropdownItem lang={item.lang} />
              </a>
            )}
          </DropdownItem>
        ))}
    </Dropdown>
  </li>
);

function Menu() {
  const items: {
    url: string;
    label: string;
    icon: IconName;
  }[] = [
    {
      url: "/",
      label: l.recipes,
      icon: "house-door",
    },
    /*, {
          url: "/statistics",
          label: "Statistics", // TODO
          icon: "bar-chart"
        }*/
  ];

  return (
    <>
      {items
        .map((item) => ({ item, active: Page.currentUrl.pathname === item.url }))
        .map(({ item, active }) => (
          <li class={classNames("nav-item", { active: active })}>
            {active
              ? (
                <>
                  <Icon name={item.icon} />
                  {item.label}
                </>
              )
              : (
                <a href={item.url}>
                  <Icon name={item.icon} />
                  {item.label}
                </a>
              )}
          </li>
        ))}
    </>
  );
}

const DarkModeSwitcher = () => (
  <li className="nav-item" id="dark-mode-switcher" data-cmp="DarkModeSwitcher">
    <span className={classNames("active", { "hidden": !Page.dark })}>
      <Icon name="sun-fill" />
      {l.lightMode}
    </span>
    <span className={classNames("inactive", { hidden: Page.dark })}>
      <Icon name="moon" />
      {l.darkMode}
    </span>
  </li>
);

export const Header = () => (
  <header>
    <div class="container header-inner">
      <a href="/" class="app">
        <div class="app-icon">
          <Icon name="journal-richtext" />
        </div>
        <div class="app-name">
          {l.appName}
        </div>
      </a>

      <ul class="nav">
        <Menu />
      </ul>
      <ul class="nav">
        <DarkModeSwitcher />
        <LanguageDropdown />
      </ul>
    </div>
  </header>
);
