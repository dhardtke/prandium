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

function initializeRating() {
  const SELECTORS = {
    RATING: "#recipe-rating",
    CURRENT_VALUE: ".current"
  };

  const $rating = document.querySelector<HTMLDivElement>(SELECTORS.RATING)!;
  const $currentValue = $rating.querySelector(SELECTORS.CURRENT_VALUE)!;
  $rating.querySelectorAll<HTMLInputElement>("input").forEach(($radio) => {
    $radio.addEventListener("change", async () => {
      await fetch(`${new URL(window.location.href).pathname}/rate`, {
        method: "POST",
        body: new URLSearchParams({ rating: $radio.value })
      });
      $currentValue.textContent = parseFloat($radio.value).toFixed(1);
    });
  });
}

export const RecipeDetailPage = async () => {
  registerPortionsControls();
  initializeRating();

  await requestWakeLock();
};
