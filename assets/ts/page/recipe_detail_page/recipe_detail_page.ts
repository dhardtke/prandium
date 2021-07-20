import { requestWakeLock } from "./wake_lock.ts";

const Selectors = {
  Rating: "#recipe-rating",
  CurrentValue: ".current"
} as const;

function registerPortionsControls() {
  const $form = document.getElementById("ingredients-form") as HTMLFormElement;
  if (!$form) {
    return;
  }
  const $input = $form.querySelector("input");
  if (!$input) {
    return;
  }
  const registerUpdateListener = ($el: HTMLElement | null, increment: number) => {
    let timeout: number;
    $el?.addEventListener("click", () => {
      const oldValue = $input.value;
      $input.value = (parseInt($input.value) + increment).toString();
      if (timeout) {
        window.clearTimeout(timeout);
      }
      if ($form.checkValidity()) {
        timeout = setTimeout(() => {
          $form.submit();
        }, 350);
      } else {
        $input.value = oldValue;
      }
    });
  };
  registerUpdateListener($form.querySelector(".plus"), 1);
  registerUpdateListener($form.querySelector(".minus"), -1);
}

function initializeRating() {
  const $rating = document.querySelector<HTMLDivElement>(Selectors.Rating)!;
  const $currentValue = $rating.querySelector(Selectors.CurrentValue)!;
  $rating.querySelectorAll<HTMLInputElement>("input").forEach(($radio) => {
    $radio.addEventListener("change", async () => {
      await fetch(`${new URL(window.location.href).pathname}/rate`, {
        method: "POST",
        body: new URLSearchParams({ rating: $radio.value }),
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
