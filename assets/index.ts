/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
//@ts-ignore
/// <reference lib="deno.ns" />
// TODO do not import everything - probably not possible with bootstrap's current architecture
import "./node_modules/bootstrap/dist/js/bootstrap.js";
import { recipeDetailPage } from "./ts/recipe_detail_page.ts";

const routes = [
  {
    match: /^\/recipe\/\d+\//,
    fn: recipeDetailPage
  }
];

for (const route of routes) {
  if (window.location.pathname.match(route.match)) {
    route.fn();
    break;
  }
}
