/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
//@ts-ignore
/// <reference lib="deno.ns" />

import { DarkModeSwitcher } from "./ts/global/_navbar_dark_mode_switcher.ts";
import { NavbarTagFilter } from "./ts/global/_navbar_tag_filter.ts";
import { recipeDetailPage } from "./ts/page/recipe_detail_page.ts";
import { recipeListPage } from "./ts/page/recipe_list_page.ts";

import "./deps.ts";

const globals = [
  () => new NavbarTagFilter(),
  () => DarkModeSwitcher()
];
for (const global of globals) {
  global();
}

const routes = [
  {
    match: /^\/recipe\/*$/,
    fn: recipeListPage
  },
  {
    match: /^\/recipe\/\d+\//,
    fn: recipeDetailPage
  }
];

for (const route of routes) {
  if (window.location.pathname.match(route.match)) {
    route.fn();
  }
}
