import { t } from "../../helpers/translation_helper.ts";
import { html } from "../../mod.ts";

function Item(title: string, active: boolean, url?: string) {
  return active
    ? html`
    <li class="breadcrumb-item active">
      ${title}
    </li>
  `
    : html`
    <li class="breadcrumb-item">
      ${url ? html`<a href="${url}">${title}</a>` : title}
    </li>`;
}

export function Breadcrumb(
  noMargin = false,
  ...items: { title: string; url?: string }[]
) {
  return html`
    <nav>
      <ol class="breadcrumb${noMargin ? " mb-0" : ""}">
        ${Item(t("home"), !items?.length, "/")}
        ${items &&
    items.map((item, i) => Item(item.title, i === items.length - 1, item.url))}
      </ol>
    </nav>
  `;
}
