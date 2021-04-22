// deno-fmt-ignore-file
import { Pagination as _Pagination } from "../../../data/pagination.ts";
import { e, html } from "../../mod.ts";
import { t } from "../../util/translation.ts";
import { Icon } from "./icon.ts";

export const PaginationPartial = <T>(pagination: _Pagination<T>) => pagination.hasPages && html`
  <nav>
    <ul class="pagination justify-content-center mt-3">
      ${
        pagination.isFirstPage
          ? html`
            <li class="page-item disabled">
              <span class="page-link">
                  ${Icon("arrow-left-short")}
              </span>
            </li>
          `
          : html`
            <li class="page-item">
              <a class="page-link" href="${pagination.previousPage
                ?.url}" rel="prev" title="${e(t("pagination.previous"))}">
                ${Icon("arrow-left-short")}
              </a>
            </li>`
      }

      ${pagination.pages.map((page) =>
        page.number === pagination.currentPage
          ? html`
            <li class="page-item active">
              <span class="page-link">${page.number}</span>
            </li>`
          : html`
            <li class="page-item">
              <a class="page-link" href="${e(page.url)}">${e(page.number)}</a>
            </li>`
      )}

      ${pagination.isLastPage
        ? html`
          <li class="page-item disabled">
            <span class="page-link">${Icon("arrow-right-short")}</span>
          </li>`
        : html`
          <li class="page-item">
            <a class="page-link" href="${pagination.nextPage?.url}" rel="next" title="${e(t("pagination.next"))}">
              ${Icon("arrow-right-short")}
            </a>
          </li>`}
    </ul>
  </nav>
`;
