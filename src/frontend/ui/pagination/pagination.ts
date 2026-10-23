export const PAGE_SIZE = 10;

// The largest `offset` the list endpoints accept.
export const MAX_OFFSET = 100000;

export function parsePage(search: string): number {
  const value = new URLSearchParams(search).get('page') ?? '';
  return /^\d+$/.test(value) && Number(value) >= 1 ? Number(value) : 1;
}

export function pageCount(total: number, size: number): number {
  return Math.min(Math.max(1, Math.ceil(total / size)), Math.floor(MAX_OFFSET / size) + 1);
}

export function pageOffset(page: number, size: number): number {
  return Math.min((page - 1) * size, MAX_OFFSET);
}

export function pagePath(path: string, page: number): string {
  return page === 1 ? path : `${path}?page=${page}`;
}

// A hole of exactly one page shows that page, which is no wider than a gap.
export function pageItems(page: number, pages: number): (number | 'gap')[] {
  const shown = [...new Set([1, page - 1, page, page + 1, pages])].filter((n) => n >= 1 && n <= pages).toSorted((a, b) => a - b);
  const items: (number | 'gap')[] = [];
  let previous = 0;
  for (const n of shown) {
    if (n - previous === 2) {
      items.push(n - 1);
    } else if (n - previous > 2) {
      items.push('gap');
    }
    items.push(n);
    previous = n;
  }
  return items;
}
