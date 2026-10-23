// The ETag and a page's `?v=` must both come from here, or they would never match.
export function contentTag(body: string | Uint8Array<ArrayBuffer>): string {
  return Bun.hash(body).toString(36);
}
