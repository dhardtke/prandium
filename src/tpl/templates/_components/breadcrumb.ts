// deno-fmt-ignore-file
import { l } from "../../../i18n/mod.ts";
import { e, html } from "../../mod.ts";

const Item = (title: string, active: boolean, url?: string) =>
  active
    ? html`
      <li class="active">
        ${title}
      </li>
    `
    : html`
      <li>
        ${url ? html`<a href="${url}">${title}</a>` : title}
      </li>`;

export const Breadcrumb = (
  noMargin = false,
  ...items: { title: string; url?: string }[]
) =>
  html`
    <ol class="breadcrumb${noMargin && " mb-0"}">
      ${Item(e(l.recipes), !items?.length, "/")}
      ${items && items.map((item, i) =>
        Item(e(item.title), i === items.length - 1, item.url)
      )}
    </ol>
  `;
