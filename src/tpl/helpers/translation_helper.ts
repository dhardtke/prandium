import {log, path} from "../../deps.ts";

const SCRIPT_DIR = path.dirname(path.fromFileUrl(import.meta.url));

export class TranslationHelper {
    private static I18N_DIR = path.resolve(SCRIPT_DIR, "..", "..", "..", "i18n");

    public static INSTANCE: TranslationHelper = new TranslationHelper();

    private static SUPPORTED_LANGUAGES: string[] = ["en", "de"];
    private static GLOBAL_FILENAME = "_globals";

    private cache: Map<String, any> = new Map();

    private constructor() {
    }

    /**
     * Returns the value of the JSON object for the current language.
     * @param key a key such as "breadcrumb.title"
     * @param name the name of the translation file, e.g. "index" - if not provided only _globals will be searched
     */
    public t = (key: string, name?: string): string | undefined => {
        const lang = TranslationHelper.SUPPORTED_LANGUAGES[0]; // TODO support different languages
        try {
            const global = this.getTranslation(lang, TranslationHelper.GLOBAL_FILENAME);
            const translation = {...global, ...(name ? this.getTranslation(lang, name) : {})};

            return TranslationHelper.get(key, translation);
        } catch (e) {
            return undefined;
        }
    }

    private getTranslation(lang: string, name: string): any {
        const path = TranslationHelper.buildPath(lang, name);
        if (this.cache.has(path)) {
            return this.cache.get(path);
        }
        log.debug(`${path} not found in cache. Reading from disk...`);
        const parsed = JSON.parse(Deno.readTextFileSync(path));
        this.cache.set(path, parsed);
        return parsed;
    }

    private static buildPath(lang: string, name: string): string {
        return path.resolve(TranslationHelper.I18N_DIR, lang, `${name}.json`);
    }

    private static get(key: string, obj: any): string {
        return key.split(".").reduce((o, i) => o[i], obj);
    }

    public api = {
        t: this.t
    };
}
