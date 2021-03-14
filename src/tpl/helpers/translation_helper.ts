import { log, path } from "../../deps.ts";
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
   */
  public t = (key: string): string | undefined => {
    const lang = TranslationHelper.SUPPORTED_LANGUAGES[0]; // TODO support different languages
    try {
      const translation = this.getTranslation(lang);
      return get(key, translation);
    } catch (e) {
      return undefined;
    }
  };

  public api = {
    t: this.t,
  };

  private getTranslation(lang: string): Record<string, unknown> {
    const path = TranslationHelper.buildPath(lang);
    if (this.cache.has(path)) {
      return this.cache.get(path)!;
    }
    log.debug(`${path} not found in cache. Reading from disk...`);
    const parsed = JSON.parse(Deno.readTextFileSync(path));
    this.cache.set(path, parsed);
    return parsed;
  }
}
