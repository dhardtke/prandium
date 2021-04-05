export function urlWithParams(
  url: string | URL,
  params: { [name: string]: unknown },
  base?: URL,
): URL {
  const source = new URL(url.toString(), base);
  for (const key of Object.keys(params)) {
    source.searchParams.append(key, "" + params[key]);
  }
  return source;
}
