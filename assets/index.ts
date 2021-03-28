/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
//@ts-ignore
/// <reference lib="deno.ns" />
// TODO do not import everything - probably not possible with bootstrap's current architecture
//import * as bootstrap from "./node_modules/bootstrap/dist/js/bootstrap.js";
export * as bootstrap from "https://cdn.skypack.dev/bootstrap@5.0.0-beta3?min";
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
