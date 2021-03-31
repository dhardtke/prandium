/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
//@ts-ignore
/// <reference lib="deno.ns" />
import { NavbarTagFilter } from "./ts/global/_navbar_tag_filter.ts";
import { recipeDetailPage } from "./ts/page/recipe_detail_page.ts";

// export const bootstrap = {
//   Tooltip: null
// };

const globals = [
  () => new NavbarTagFilter()
];
for (const global of globals) {
  global();
}

const routes = [
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
