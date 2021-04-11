import { TagFilter } from "./tag_filter.ts";

function registerOrderByControl() {
  const $orderBy = document.getElementById("orderBy") as HTMLFormElement;
  if (!$orderBy) {
    return;
  }
  const $select = $orderBy.querySelector("select");
  $select!.addEventListener("change", () => {
    $orderBy.submit();
  });
}

export const RecipeListPage = () => {
  registerOrderByControl();
  new TagFilter();
};
