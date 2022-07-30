import { fs, log, path } from "../../../deps.ts";
import { fetchCustom, FetchFn } from "./fetch.ts";

export function getThumbnailDir(configDir: string): string {
  return path.join(configDir, "thumbnails");
}

export function getUniqueFilename(dir: string, origFilename: string): string {
  let candidate = origFilename;
  const parsed = path.parse(origFilename);
  let i = 0;
  while (fs.existsSync(path.join(dir, candidate))) {
    i++;
    candidate = `${parsed.base}-${i}${parsed.ext}`;
  }
  return candidate;
}

export async function downloadThumbnail(
  configDir: string,
  userAgent: string,
  url?: string,
  fetchFn: FetchFn = fetchCustom,
): Promise<string | undefined> {
  if (!url) {
    return undefined;
  }
  const thumbnailDir = getThumbnailDir(configDir);
  const filename = getUniqueFilename(
    thumbnailDir,
    path.basename(decodeURIComponent(new URL(url).pathname)),
  );
  log.debug(() => `[Thumbnail] Downloading ${url} as ${filename}`);
  const response = await fetchFn(url, userAgent);
  await Deno.writeFile(
    path.join(thumbnailDir, filename),
    new Uint8Array(await response.arrayBuffer()),
  );
  return filename;
}
