/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
//@ts-ignore
/// <reference lib="deno.ns" />

import { DarkModeSwitcher } from "./ts/global/_navbar_dark_mode_switcher.ts";
import { NavbarTagFilter } from "./ts/global/_navbar_tag_filter.ts";
import { removeUrlFlashParameter } from "./ts/global/_remove_url_flash_parameter.ts";
import { showDocument } from "./ts/global/_show_document.ts";
import { RecipeDetailPage } from "./ts/page/recipe_detail_page.ts";
import { RecipeEditPage } from "./ts/page/recipe_edit_page/recipe_edit_page.ts";
import { RecipeListPage } from "./ts/page/recipe_list_page.ts";

import "./deps.ts";

const globals = [
  () => showDocument(),
  () => new NavbarTagFilter(),
  () => DarkModeSwitcher(),
  () => removeUrlFlashParameter()
];
for (const global of globals) {
  global();
}

const routes = [
  {
    match: /^\/recipe\/?$/,
    fn: RecipeListPage
  },
  {
    match: /^\/recipe\/\d+\/[^\/]+\/?$/,
    fn: RecipeDetailPage
  },
  {
    match: /^\/recipe\/\d+\/[^\/]+\/edit/,
    fn: RecipeEditPage
  },
  {
    match: /^\/recipe\/create/,
    fn: RecipeEditPage
  }
];

for (const route of routes) {
  if (window.location.pathname.match(route.match)) {
    route.fn();
  }
}
