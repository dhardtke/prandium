import type { Language } from '../i18n/language.ts';

// Labels read the current dictionary on every render, so they follow a language change.
export type Label = (language: Language) => string;

export interface Crumb {
  path: string;
  label: Label;
}

export interface RouteDef {
  pattern: RegExp;
  keys: string[];
  view: (params: Record<string, string>) => Promise<Element>;
  title?: Label;
  parents?: Crumb[];
  // `path` is explicit because a regex cannot be turned back into an href.
  nav?: Crumb;
}

export interface RouteMatch {
  route: RouteDef;
  params: Record<string, string>;
}

export function matchRoute(routes: readonly RouteDef[], path: string): RouteMatch | null {
  for (const route of routes) {
    const match = route.pattern.exec(path);
    if (!match) {
      continue;
    }
    const params: Record<string, string> = {};
    route.keys.forEach((key, index) => {
      params[key] = match[index + 1] ?? '';
    });
    return { route, params };
  }
  return null;
}

export function currentPath(): string {
  return location.pathname;
}

export function navigate(path: string): void {
  if (location.pathname + location.search !== path) {
    history.pushState(null, '', path);
  }
  // pushState fires no event, and the same route must refresh too.
  window.dispatchEvent(new PopStateEvent('popstate'));
}

export function onRouteChange(listener: () => void): () => void {
  window.addEventListener('popstate', listener);
  return () => {
    window.removeEventListener('popstate', listener);
  };
}

export function isActive(path: string): boolean {
  const current = currentPath();
  return path === '/' ? current === '/' : current.startsWith(path);
}

export interface LinkClick {
  button: number;
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  defaultPrevented: boolean;
}

export interface LinkTarget {
  href: string;
  target: string;
  download: boolean;
}

export function linkPath(click: LinkClick, link: LinkTarget, origin: string): string | null {
  const isHandledElsewhere = click.defaultPrevented;
  const isPrimaryButton = click.button === 0;
  const hasModifierKey = click.ctrlKey || click.metaKey || click.shiftKey || click.altKey;
  const opensInOtherContext = link.target !== '' && link.target !== '_self';
  const isDownload = link.download;
  if (isHandledElsewhere || !isPrimaryButton || hasModifierKey || opensInOtherContext || isDownload) {
    return null;
  }

  const url = new URL(link.href, origin);
  const path = url.pathname;
  const isOtherOrigin = url.origin !== origin;
  const hasQueryOrFragment = url.search !== '' || url.hash !== '';
  const isApiPath = path === '/api' || path.startsWith('/api/');
  // The server's fallback serves index.html only for extension-less paths; anything else is a file.
  const isFilePath = path.slice(path.lastIndexOf('/') + 1).includes('.');
  if (isOtherOrigin || hasQueryOrFragment || isApiPath || isFilePath) {
    return null;
  }

  return path;
}
