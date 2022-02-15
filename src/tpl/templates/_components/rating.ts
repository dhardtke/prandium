// deno-fmt-ignore-file
import { html } from "../../mod.ts";
import { Icon, IconName } from "./icon.ts";

export function Rating(name: string, value = 0, readonly = false, small = false) {
  const comparisonValue = Math.round(value * 2) / 2;

  let stars = "";
  for (let i = 10; i >= 1; i--) {
    const half = i % 2 !== 0;
    const current = i / 2;
    stars += html`
      <input type="radio" id="${name}-${i}" name="${name}" value="${current}" ${!readonly && `autocomplete="off"`}
             ${current === comparisonValue && " checked"}${readonly && " disabled"}/>
      <label for="${name}-${i}" ${!readonly && `title="${current}"`}${half && ` class="half"`}>
        ${Icon(`star-${half ? "half" : "fill"}` as IconName)}
      </label>
    `;
  }

  return html`
    <div class="rating${readonly && " disabled"}${small && " small"}">
      ${stars}
    </div>
  `;
}
