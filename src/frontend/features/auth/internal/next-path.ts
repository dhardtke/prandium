const LOGIN_PATH = '/login';

// Resolved as a URL so `//evil`, `/\evil` and tab-smuggled `/<TAB>/evil` are rejected.
export function nextPath(search: string, origin: string): string {
  const next = new URLSearchParams(search).get('next');
  if (next === null) {
    return '/';
  }
  let url: URL;
  try {
    url = new URL(next, origin);
  } catch {
    return '/';
  }
  if (url.origin !== origin || url.pathname === LOGIN_PATH || url.pathname === `${LOGIN_PATH}/`) {
    return '/';
  }
  return url.pathname + url.search;
}
