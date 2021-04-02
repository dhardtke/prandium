import { log, path } from "../../../deps.ts";
import { get, root } from "../../util.ts";

export class TranslationHelper {
  public static INSTANCE: TranslationHelper = new TranslationHelper();
  private static I18N_DIR = root("i18n");
  private static SUPPORTED_LANGUAGES: string[] = ["en", "de"];

  private cache: Map<string, Record<string, unknown>> = new Map();

  private constructor() {
  }

  private static buildPath(lang: string): string {
    return path.resolve(TranslationHelper.I18N_DIR, `${lang}.json`);
  }

  /**
   * Returns the value of the JSON object for the current language.
   * @param key a key such as "breadcrumb.title"
   * @param params parameters to replace in the translation key, e.g. "{{step}}" would be replaced with "1" when passed as "{step: 1}"
   */
  public t = (
    key: string,
    params?: Record<string, unknown>,
  ): string | undefined => {
    const lang = TranslationHelper.SUPPORTED_LANGUAGES[0]; // TODO support different languages
    try {
      const translation = this.getTranslation(lang);
      return TranslationHelper.replaceParams(get(key, translation), params);
    } catch (e) {
      log.debug(() => `[TranslationHelper] Cannot get translation key ${key}.`);
      return undefined;
    }
  };

  private static replaceParams<T>(
    value: string,
    params?: Record<string, unknown>,
  ): string {
    return params
      ? Object.entries(params).reduce((acc, cur) => {
        return acc.replaceAll(`{{${cur[0]}}}`, cur[1] + "");
      }, value)
      : value;
  }

  public api = {
    t: this.t,
  };

  private getTranslation(lang: string): Record<string, unknown> {
    const path = TranslationHelper.buildPath(lang);
    if (this.cache.has(path)) {
      return this.cache.get(path)!;
    }
    log.debug(() => `[TranslationHelper] ${path} not found in cache. Reading from disk...`);
    const parsed = JSON.parse(Deno.readTextFileSync(path));
    this.cache.set(path, parsed);
    return parsed;
  }
}
