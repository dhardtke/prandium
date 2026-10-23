export type FetchFn = (url: string, userAgent: string) => Promise<Response>;

/** Sends the configured User-Agent; some recipe sites refuse Bun's. */
export const fetchWithUserAgent: FetchFn = (url, userAgent) => fetch(url, { headers: { 'User-Agent': userAgent } });
