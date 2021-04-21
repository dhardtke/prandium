import { html } from "../../mod.ts";
import { Icon } from "./icon.ts";

export function Rating(value = 0, readonly = false) {
  const id = "rating" + Math.random().toString(36).substring(7);
  const comparisonValue = Math.round(value * 2) / 2;

  let stars = "";
  for (let i = 10; i >= 1; i--) {
    const half = i % 2 !== 0;
    const current = i / 2;
    stars += html`
      <input type="radio" id="${id}-${i}" name="${id}" value="${current}" autocomplete="off"
             ${current === comparisonValue && " checked"}${readonly &&
      " disabled"}/>
      <label for="${id}-${i}" title="${!readonly && current}" ${half &&
      'class="half"'}>
        ${Icon(`star-${half ? "half" : "fill"}`)}
      </label>
    `;
  }

  return html`
    <fieldset class="rating${readonly && " disabled"}">
      ${stars}
    </fieldset>
  `;
}
