import { TagFilter } from "./tag-filter.ts";

const Selectors = {
  Pagination: ".pagination",
  RecipeList: "#recipe-list",
  OrderBy: "#orderBy"
} as const;

function registerOrderByControl() {
  const $orderBy = document.querySelector<HTMLFormElement>(Selectors.OrderBy);
  if ($orderBy) {
    const $select = $orderBy.querySelector("select");
    $select!.addEventListener("change", () => {
      $orderBy.submit();
    });
  }
}

export const RecipeListPage = () => {
  registerOrderByControl();
  console.assert(Boolean(TagFilter));
};
