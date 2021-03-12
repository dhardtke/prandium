import {Eta, log, path} from "../deps.ts";
import {Recipe} from "../data/model/recipe.ts";
import {Pagination} from "../data/pagination.ts";

const SCRIPT_DIR = path.dirname(path.fromFileUrl(import.meta.url));
const TEMPLATE_DIR = path.resolve(SCRIPT_DIR, "templates");

Eta.configure({
    useWith: true,
    views: TEMPLATE_DIR,
    rmWhitespace: false // TODO turn this on if dev is off
});

interface Helper {
    api: { [key: string]: any };
}

class TranslationHelper implements Helper {
    private static I18N_DIR = path.resolve(SCRIPT_DIR, "..", "..", "i18n");

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

class IconHelper implements Helper {
    private static ICON_DIR = path.resolve(SCRIPT_DIR, "..", "..", "assets", "node_modules", "bootstrap-icons", "icons");

    public static INSTANCE: IconHelper = new IconHelper();

    private cache: Map<String, any> = new Map();

    private constructor() {
    }

    /**
     * Reads the SVG contents for an icon with the given name.
     * @param name the icon name, e.g. "arrow-right-short"
     */
    public i = (name: string): string | undefined => {
        if (this.cache.has(name)) {
            return this.cache.get(name);
        }
        const _path = IconHelper.buildPath(name);
        if (path.dirname(_path) !== IconHelper.ICON_DIR) {
            throw new Error(`Detected attempt to read outside of icon dir: ${_path}`);
        }
        try {
            const svg = Deno.readTextFileSync(_path);
            this.cache.set(name, svg);
            return svg;
        } catch (e) {
            log.warning(`Icon ${name} not found. Attempted path: ${_path}`);
            return undefined;
        }
    }

    private static buildPath(name: string): string {
        return path.resolve(IconHelper.ICON_DIR, `${name}.svg`);
    }

    public api = {
        i: this.i
    };
}

type Helpers = typeof TranslationHelper.INSTANCE.api & typeof IconHelper.INSTANCE.api;

interface TemplateData<Data = void> {
    data?: Data;
    h: Helpers;
}

export class Template<Data = void> {
    private readonly filename: string;
    private source?: string;

    constructor(filename: string) {
        this.filename = filename;
    }

    private async updateSource(): Promise<string> {
        if (this.source == null) {
            try {
                const fullPath = path.resolve(TEMPLATE_DIR, this.filename);
                this.source = await Deno.readTextFile(fullPath);
            } catch (e) {
                log.error(`Could not load ${this.filename}`);
                throw e;
            }
        }
        return this.source;
    }

    public async render(data?: Data): Promise<string> {
        return this.updateSource()
            .then((s) => Eta.render(s, this.buildArgs(data)) as string)
            .catch(e => {
                log.error(`Could not render ${this.filename}`);
                throw e;
            });
    }

    private buildArgs(data?: Data): TemplateData {
        return {
            ...data || {},
            ...{
                h: {
                    ...TranslationHelper.INSTANCE.api,
                    ...IconHelper.INSTANCE.api
                }
            }
        };
    }
}

export const IndexTemplate = new Template<{ favoriteCake: string }>("index.eta.html");
export const RecipeListTemplate = new Template<{ recipes: Pagination<Recipe> }>("recipes.eta.html");
export const RecipeDetailTemplate = new Template("recipe.eta.html");
