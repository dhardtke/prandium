import { requestWakeLock } from "./wake_lock.ts";

function registerPortionsControls() {
  const $form = document.getElementById("ingredients-form") as HTMLFormElement;
  if (!$form) {
    return;
  }
  const $input = $form.querySelector("input");
  if (!$input) {
    return;
  }
  const $plus = $form.querySelector(".plus");
  let timeout: number;
  $plus?.addEventListener("click", () => {
    $input.value = (parseInt($input.value) + 1).toString();
    if (timeout) {
      window.clearTimeout(timeout);
    }
    if ($form.checkValidity()) {
      timeout = setTimeout(() => {
        $form.submit();
      }, 350);
    }
  });
  const $minus = $form.querySelector(".minus");
  $minus?.addEventListener("click", () => {
    $input.value = (parseInt($input.value) - 1).toString();
    if (timeout) {
      window.clearTimeout(timeout);
    }
    if ($form.checkValidity()) {
      timeout = setTimeout(() => {
        $form.submit();
      }, 350);
    }
  });
}

export const RecipeDetailPage = async () => {
  registerPortionsControls();

  await requestWakeLock();
};
