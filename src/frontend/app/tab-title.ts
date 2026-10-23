// Must match the <title> in index.html.
export const APP_TITLE = 'Prandium';

export function tabTitle(name: string | null): string {
  return name === null ? APP_TITLE : `${name} · Prandium`;
}
