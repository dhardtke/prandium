export type Change = { swap: string } | { reload: string };

const RELOAD_EXTENSIONS = ['.ts', '.html', '.webmanifest', '.svg', '.png'];

// fs.watch also reports bare directories and editor swap files; other extensions are ignored.
export function changeFor(relativePath: string): Change | null {
  const url = `/${relativePath.replaceAll('\\', '/')}`;
  if (url.endsWith('.css')) {
    return { swap: url };
  }
  if (RELOAD_EXTENSIONS.some((extension) => url.endsWith(extension))) {
    return { reload: url };
  }
  return null;
}
