/** @jsxImportSource https://esm.sh/preact@10.11.0?pin=v67 */
import { classNames } from "../../../../deps.ts";
import { Pagination as _Pagination } from "../../../data/pagination.ts";
import { l } from "../../../i18n/mod.ts";
import { Icon } from "./icon.tsx";

export const PaginationComponent = (props: { pagination: _Pagination<unknown>; wrapperClass?: string }) => (
    <>
        {props.pagination.hasPages && (
            <ul class={classNames("pagination", props.wrapperClass)}>
                {props.pagination.isFirstPage
                    ? (
                        <li>
                            <span class="page-link disabled">
                                <Icon name="arrow-left-short" />
                            </span>
                        </li>
                    )
                    : (
                        <li>
                            <a class="page-link" href={props.pagination.previousPage?.url} rel="prev" title={l.pagination.previous}>
                                <Icon name="arrow-left-short" />
                            </a>
                        </li>
                    )}

                {props.pagination.pages.map((page) =>
                    page.number === props.pagination.currentPage
                        ? (
                            <li>
                                <span class="page-link active">{page.number}</span>
                            </li>
                        )
                        : (
                            <li>
                                <a class="page-link" href={page.url}>{page.number}</a>
                            </li>
                        )
                )}

                {props.pagination.isLastPage
                    ? (
                        <li>
                            <span class="page-link disabled">
                                <Icon name="arrow-right-short" />
                            </span>
                        </li>
                    )
                    : (
                        <li>
                            <a class="page-link" href={props.pagination.nextPage?.url} rel="next" title={l.pagination.next}>
                                <Icon name="arrow-right-short" />
                            </a>
                        </li>
                    )}
            </ul>
        )}
    </>
);
