/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
//@ts-ignore
/// <reference lib="deno.ns" />

import "./deps.ts";
import { bootComponents, Component } from "./ts/components/component.ts";
import { Observer } from "./ts/components/observer.ts";
import { NavbarDarkModeSwitcher } from "./ts/global/_navbar_dark_mode_switcher.ts";
import { removeUrlFlashParameter } from "./ts/global/_remove_url_flash_parameter.ts";
import { RecipeDetailPage } from "./ts/page/recipe_detail_page/recipe_detail_page.ts";
import { RecipeEditPage } from "./ts/page/recipe_edit_page/recipe_edit_page.ts";
import { RecipeListPage } from "./ts/page/recipe_list_page/recipe_list_page.ts";

// components
Component.register("Observer", Observer);
bootComponents();

const globals = [
  () => NavbarDarkModeSwitcher(),
  () => removeUrlFlashParameter(),
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

(async () => {
  for (const route of routes) {
    if (window.location.pathname.match(route.match)) {
      const result = route.fn();
      if (result as unknown instanceof Promise) {
        await result;
      }
    }
  }
})();
