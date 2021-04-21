import { log, path } from "../../../deps.ts";
import { get, root } from "../../util.ts";

const I18N_DIR = root("i18n");
const SUPPORTED_LANGUAGES: string[] = ["en", "de"];

const cache: Map<string, Record<string, unknown>> = new Map();

function buildPath(lang: string): string {
  return path.resolve(I18N_DIR, `${lang}.json`);
}

function replaceParams<T>(
  value: string,
  params?: Record<string, unknown>,
): string {
  return params
    ? Object.entries(params).reduce((acc, cur) => {
      return acc.replaceAll(`{{${cur[0]}}}`, cur[1] + "");
    }, value)
    : value;
}

function getTranslation(lang: string): Record<string, unknown> {
  const path = buildPath(lang);
  if (cache.has(path)) {
    return cache.get(path)!;
  }
  log.debug(() =>
    `[TranslationHelper] ${path} not found in cache. Reading from disk...`
  );
  const parsed = JSON.parse(Deno.readTextFileSync(path));
  cache.set(path, parsed);
  return parsed;
}

/**
 * Returns the value of the JSON object for the current language or the key if not found.
 * @param key a key such as "breadcrumb.title"
 * @param params parameters to replace in the translation key, e.g. "{{step}}" would be replaced with "1" when passed as "{step: 1}"
 */
export function t(
  key: string,
  params?: Record<string, unknown>,
): string {
  const lang = SUPPORTED_LANGUAGES[0]; // TODO support different languages
  try {
    const translation = getTranslation(lang);
    return replaceParams(get(key, translation), params) ||
      key;
  } catch {
    log.debug(() => `[TranslationHelper] Cannot get translation key ${key}.`);
    return key;
  }
}
