/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
/// <reference lib="deno.ns" />

import { bootComponents } from "./ts/components/component.ts";
import { DarkModeSwitcher } from "./ts/global/dark-mode-switcher.component.ts";
import { registerOnPopstateListener } from "./ts/global/_popstate_reload.ts";
import { removeUrlFlashParameter } from "./ts/global/_remove_url_flash_parameter.ts";
import { RecipeDetailPage } from "./ts/page/recipe_detail_page/recipe_detail_page.ts";
import { RecipeEditPage } from "./ts/page/recipe_edit_page/recipe_edit_page.ts";
import { RecipeListPage } from "./ts/page/recipe_list_page/recipe_list_page.ts";

// components
console.assert(Boolean(DarkModeSwitcher));
bootComponents();

const globals = [
  () => removeUrlFlashParameter(),
  () => registerOnPopstateListener(),
];
for (const global of globals) {
  global();
}

const routes = [
  {
    match: /^\/$/,
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
