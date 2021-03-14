export interface Page {
  number: number;
  url: string;
}

const PAGE_PARAMETER = "page";

// based on https://jasonwatmore.com/post/2018/08/07/javascript-pure-pagination-logic-in-vanilla-js-typescript
export class PaginationBuilder<T> {
  private readonly totalItems!: number;
  private readonly totalPages!: number;
  private readonly currentPage!: number;
  private readonly pageSize!: number;
  private readonly startPage!: number;
  private readonly endPage!: number;
  private readonly startIndex!: number;
  private readonly endIndex!: number;

  public constructor(
    totalItems: number,
    currentPage: number = 1,
    pageSize: number = 10,
    maxPages: number = 10,
  ) {
    this.totalItems = totalItems;
    this.pageSize = pageSize;
    this.totalPages = Math.ceil(totalItems / pageSize);

    // ensure current page isn't out of range
    this.currentPage = currentPage;
    if (currentPage < 1) {
      this.currentPage = 1;
    } else if (currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }

    if (this.totalPages <= maxPages) {
      // total pages less than max so show all pages
      this.startPage = 1;
      this.endPage = this.totalPages;
    } else {
      // total pages more than max so calculate start and end pages
      const maxPagesBeforeCurrentPage = Math.floor(maxPages / 2);
      const maxPagesAfterCurrentPage = Math.ceil(maxPages / 2) - 1;
      if (currentPage <= maxPagesBeforeCurrentPage) {
        // current page near the start
        this.startPage = 1;
        this.endPage = maxPages;
      } else if (
        this.currentPage + maxPagesAfterCurrentPage >= this.totalPages
      ) {
        // current page near the end
        this.startPage = this.totalPages - maxPages + 1;
        this.endPage = this.totalPages;
      } else {
        // current page somewhere in the middle
        this.startPage = currentPage - maxPagesBeforeCurrentPage;
        this.endPage = currentPage + maxPagesAfterCurrentPage;
      }
    }

    this.startIndex = (
      this.currentPage - 1
    ) * pageSize;
    this.endIndex = Math.min(this.startIndex + pageSize - 1, totalItems - 1);
  }

  private static buildPageUrl(url: URL, page: number): string {
    url.searchParams.set(PAGE_PARAMETER, page + "");
    return url.toString();
  }

  private static buildPage(url: URL, page: number): Page {
    return (
      { number: page, url: PaginationBuilder.buildPageUrl(url, page) }
    );
  }

  public build(
    items: (limit: number, offset: number) => T[],
    currentUrl: URL,
  ): Pagination<T> {
    const url = new URL(currentUrl.toString());
    const pages = Array.from(
      Array(
        (
          this.endPage + 1
        ) - this.startPage,
      ).keys(),
    )
      .map((i) => this.startPage + i)
      .map((number) => PaginationBuilder.buildPage(url, number));
    const previousPage = this.currentPage === this.startPage
      ? undefined
      : PaginationBuilder.buildPage(url, this.currentPage - 1);
    const nextPage = this.currentPage === this.endPage
      ? undefined
      : PaginationBuilder.buildPage(url, this.currentPage + 1);

    return new Pagination<T>(
      this.pageSize,
      this.currentPage,
      this.totalItems,
      this.totalPages,
      this.startPage,
      this.endPage,
      this.startIndex,
      this.endIndex,
      previousPage,
      nextPage,
      pages,
      items(this.pageSize, this.startIndex),
    );
  }
}

export class Pagination<T> implements Iterable<T> {
  public readonly pageSize: number;
  public readonly currentPage: number;
  public readonly totalItems: number;
  public readonly totalPages: number;
  public readonly firstPage: number;
  public readonly lastPage: number;
  public readonly startIndex: number;
  public readonly endIndex: number;
  public readonly previousPage?: Page;
  public readonly nextPage?: Page;
  public readonly pages: Page[];
  public readonly items: T[];

  public constructor(
    pageSize: number,
    currentPage: number,
    totalItems: number,
    totalPages: number,
    firstPage: number,
    lastPage: number,
    startIndex: number,
    endIndex: number,
    previousPage?: Page,
    nextPage?: Page,
    pages: Page[] = [],
    items: T[] = [],
  ) {
    this.pageSize = pageSize;
    this.currentPage = currentPage;
    this.totalItems = totalItems;
    this.totalPages = totalPages;
    this.firstPage = firstPage;
    this.lastPage = lastPage;
    this.startIndex = startIndex;
    this.endIndex = endIndex;
    this.previousPage = previousPage;
    this.nextPage = nextPage;
    this.pages = pages;
    this.items = items;
  }

  public get isFirstPage(): boolean {
    return this.currentPage === this.firstPage;
  }

  public get isLastPage(): boolean {
    return this.currentPage === this.lastPage;
  }

  public get hasPages(): boolean {
    return this.totalPages > 0;
  }

  [Symbol.iterator](): Iterator<T> {
    return this.items.values();
  }
}
