import { e, html } from "../../mod.ts";
import { t } from "../../util/translation.ts";

const Item = (title: string, active: boolean, url?: string) =>
  active
    ? html`
      <li class="breadcrumb-item active">
        ${title}
      </li>
    `
    : html`
      <li class="breadcrumb-item">
        ${url ? html`<a href="${url}">${title}</a>` : title}
      </li>`;

export const Breadcrumb = (
  noMargin = false,
  ...items: { title: string; url?: string }[]
) =>
  html`
  <nav>
    <ol class="breadcrumb${noMargin ? " mb-0" : ""}">
      ${Item(e(t("home")), !items?.length, "/")}
      ${items &&
    items.map((item, i) =>
      Item(e(item.title), i === items.length - 1, item.url)
    )}
    </ol>
  </nav>
`;
