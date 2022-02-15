import { html } from "../../mod.ts";
import { Collapsible } from "./collapsible.ts";

export interface ItemWithHtml {
  html: string;
  active?: boolean;
}

export type DropdownItem = ItemWithHtml | typeof DIVIDER;

function Item(item: DropdownItem) {
  if (item === DIVIDER) {
    return html`
      <li class="divider"></li>`;
  }
  return html`
    <li>
      <div class="item${item.active && " active"}">${item.html}</div>
    </li>
  `;
}

export function Dropdown(
  options: {
    label: string;
    labelClass?: string;
    spacing?: boolean;
    caret?: boolean | "right";
    items: DropdownItem[];
  },
) {
  return `${
    Collapsible({
      label: options.label,
      labelClass: options.labelClass,
      caret: options.caret,
      content: html`
        <ul class="dropdown${options.spacing && " dropdown--with-spacing"}">
          ${options.items.map((item) => Item(item))}
        </ul>`,
    })
  }`;
}

export const DIVIDER = Symbol();
