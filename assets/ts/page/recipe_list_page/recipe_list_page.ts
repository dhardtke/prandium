import { moveChildren } from "../../_util/dom_util.ts";
import { bootComponents } from "../../components/component.ts";
import { Events } from "../../components/observer.ts";
import { TagFilter } from "./tag_filter.ts";

const Data = {
  PaginationHasMore: "paginationHasMore",
  InfiniteScrolling: "infiniteScrolling"
} as const;

const Selectors = {
  Pagination: ".pagination",
  RecipeList: "#recipe-list",
  OrderBy: "#orderBy"
} as const;

const pageParam = "page";

function registerOrderByControl() {
  const $orderBy = document.querySelector<HTMLFormElement>(Selectors.OrderBy);
  if ($orderBy) {
    const $select = $orderBy.querySelector("select");
    $select!.addEventListener("change", () => {
      $orderBy.submit();
    });
  }
}

function registerInfiniteScrolling($recipeList: HTMLElement) {
  window.addEventListener(Events.Intersecting, async () => {
    const $pagination = document.querySelector<HTMLElement>(Selectors.Pagination);
    if (!$pagination || $pagination.dataset[Data.PaginationHasMore] !== "true") {
      return;
    }
    const url = new URL(window.location.href);
    url.searchParams.set(pageParam, String((parseInt(url.searchParams.get(pageParam) || "", 10) || 1) + 1));
    const response = await fetch(url.toString());
    if (response.status === 200) {
      const $document = new DOMParser().parseFromString(await response.text(), "text/html");
      const $newRecipeList = $document.querySelector(Selectors.RecipeList);
      const $newPagination = $document.querySelector(Selectors.Pagination);
      if (!$newRecipeList || !$newPagination) {
        return;
      }
      moveChildren($newRecipeList, $recipeList);
      $pagination.parentNode?.replaceChild($newPagination, $pagination);
      window.history.pushState({}, document.title, url.toString());

      bootComponents();
    }
  });
}

export const RecipeListPage = () => {
  registerOrderByControl();
  console.assert(Boolean(TagFilter));

  const $recipeList = document.querySelector<HTMLElement>(Selectors.RecipeList);
  if ($recipeList && $recipeList.dataset[Data.InfiniteScrolling] === "true") {
    registerInfiniteScrolling($recipeList);
  }
};
