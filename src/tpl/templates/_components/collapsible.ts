import { Events } from "../../events.ts";
import { html } from "../../mod.ts";

let count = 0;

globalThis.addEventListener(Events.PageLoaded, () => {
  count = 0;
});

export interface CollapsibleHtml {
  toString: () => string;
  labelId: string;
}

export function Collapsible(
  options: {
    label?: string;
    labelClass?: string;
    wrapperClass?: string;
    content: string;
    opened?: boolean;
    contentClass?: string;
    caret?: boolean | "right";
  },
): CollapsibleHtml {
  count++;
  const labelId = `collapsible${count}`;
  const classes = [
    options.labelClass,
    options.caret && "caret",
    options.caret === "right" && "right",
  ].filter(Boolean).join(" ");
  return {
    toString: () =>
      html`
        <div
          class="collapsible${
        options.wrapperClass && ` ${options.wrapperClass}`
      }">
          ${
        options.label &&
        html`<label for="${labelId}" ${classes && ` class="${classes}"`}>
              ${options.label}
            </label>`
      }
          <input id="${labelId}" type="checkbox" ${
        options.opened && " checked"
      } autocomplete="off">
          <div class="content${
        options.contentClass && ` ${options.contentClass}`
      }">
            ${options.content}
          </div>
        </div>`,
    labelId,
  };
}
