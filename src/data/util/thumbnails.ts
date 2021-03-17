import { fs, log, path } from "../../deps.ts";

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
  url: string,
): Promise<string> {
  const thumbnailDir = getThumbnailDir(configDir);
  const filename = getUniqueFilename(
    thumbnailDir,
    path.basename(new URL(url).pathname),
  );
  log.debug(() => `[Thumbnail] Downloading ${url} as ${filename}`);
  const response = await fetchCustom(url);
  await Deno.writeFile(
    path.join(thumbnailDir, filename),
    new Uint8Array(await response.arrayBuffer()),
  );
  return filename;
}

/**
 * Merge `source` and `target` recursively.
 * @param target the target object
 * @param source the source object
 */
// deno-lint-ignore no-explicit-any
const merge = (target: any, source: any) => {
  for (const key of Object.keys(source)) {
    if (source[key] instanceof Object) {
      Object.assign(source[key], merge(target[key], source[key]));
    }
  }

  return Object.assign(target || {}, source);
};

/**
 * A custom wrapper around fetch to make sure requests use the Googlebot User Agent.
 * @param input
 * @param init
 */
export function fetchCustom(
  input: RequestInfo,
  init?: RequestInit,
): Promise<Response> {
  return fetch(
    input,
    merge(
      init ?? {},
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
        },
      },
    ),
  );
}
