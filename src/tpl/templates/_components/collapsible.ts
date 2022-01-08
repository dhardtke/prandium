import { Events } from "../../events.ts";
import { html } from "../../mod.ts";

let count = 0;

globalThis.addEventListener(Events.PageLoaded, () => {
  count = 0;
});

export function Collapsible(
  options: {
    label: string;
    content: string;
    opened?: boolean;
    contentClass?: string;
  },
) {
  count++;
  return html`
    <div class="collapsible">
      <input id="collapsible${count}" type="checkbox" ${
    options.opened && " checked"
  } autocomplete="off">
      <label for="collapsible${count}">
        ${options.label}
      </label>
      <div class="content${options.contentClass && ` ${options.contentClass}`}">
        ${options.content}
      </div>
    </div>
  `;
}
