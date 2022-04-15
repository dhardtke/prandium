import { bootComponents } from "./ts/components/component.ts";
import { DarkModeSwitcher } from "./ts/global/dark-mode-switcher.component.ts";
import { registerOnPopstateListener } from "./ts/global/popstate-reload.ts";
import { removeUrlFlashParameter } from "./ts/global/remove-url-flash-parameter.ts";
import { RecipeDetailPage } from "./ts/page/recipe-detail-page/recipe-detail-page.ts";
import { RecipeEditPage } from "./ts/page/recipe-edit-page/recipe-edit-page.ts";
import { RecipeListPage } from "./ts/page/recipe-list-page/recipe-list-page.ts";

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
