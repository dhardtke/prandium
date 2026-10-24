// Must match the <title> in index.html.
export const APP_TITLE = 'Cena';

export function tabTitle(name: string | null): string {
  return name === null ? APP_TITLE : `${name} · Cena`;
}
