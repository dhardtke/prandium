// deno-fmt-ignore-file
import { Pagination as _Pagination } from "../../../data/pagination.ts";
import { l } from "../../../i18n/mod.ts";
import { e, html } from "../../mod.ts";
import { Icon } from "./icon.ts";

export const Pagination = <T>(pagination: _Pagination<T>) => pagination.hasPages && html`
  <ul class="pagination" data-pagination-has-more="${!pagination.isLastPage + ""}">
    ${
      pagination.isFirstPage
        ? html`
          <li>
              <span class="page-link disabled">
                  ${Icon("arrow-left-short")}
              </span>
          </li>
        `
        : html`
          <li>
            <a class="page-link" href="${pagination.previousPage
              ?.url}" rel="prev" title="${e(l.pagination.previous)}">
              ${Icon("arrow-left-short")}
            </a>
          </li>`
    }

    ${pagination.pages.map((page) =>
      page.number === pagination.currentPage
        ? html`
          <li>
            <span class="page-link active">${page.number}</span>
          </li>`
        : html`
          <li>
            <a class="page-link" href="${e(page.url)}">${e(page.number)}</a>
          </li>`
    )}

    ${pagination.isLastPage
      ? html`
        <li>
          <span class="page-link disabled">${Icon("arrow-right-short")}</span>
        </li>`
      : html`
        <li>
          <a class="page-link" href="${pagination.nextPage?.url}" rel="next" title="${e(l.pagination.next)}">
            ${Icon("arrow-right-short")}
          </a>
        </li>`}
  </ul>
`;
