import {Eta, log, Oak} from "../deps.ts";
import {path} from "../../tests/deps.ts";

const SCRIPT_DIR = path.dirname(path.fromFileUrl(import.meta.url));
const TEMPLATE_DIR = path.resolve(SCRIPT_DIR, "templates");
const I18N_DIR = path.resolve(SCRIPT_DIR, "..", "..", "i18n");

Eta.configure({
    useWith: true,
    views: TEMPLATE_DIR
});

interface Helper {
    api: { [key: string]: any };
}

class TranslationHelper implements Helper {
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
        return path.resolve(I18N_DIR, lang, `${name}.json`);
    }

    private static get(key: string, obj: any): string {
        return key.split(".").reduce((o, i) => o[i], obj);
    }

    public api = {
        t: this.t
    };
}

class Template<Data = void> {
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
                // TODO use log
                console.error(`Could not load ${this.filename}`);
                throw e;
            }
        }
        return this.source;
    }

    public async render(data?: Data): Promise<string> {
        return this.updateSource().then((s) => Eta.render(s, this.buildArgs(data || {} as any))) as Promise<string>;
    }

    private buildArgs(data: Data) {
        return {...data, ...TranslationHelper.INSTANCE.api};
    }
}

declare module "https://deno.land/x/oak@v6.5.0/mod.ts" {
    interface Context {
        render: <Data>(template: Template<Data>, data?: Data) => void;
    }

    interface RouterContext {
        render: <Data>(template: Template<Data>, data?: Data) => void;
    }
}

// based on https://deno.land/x/view_engine@v1.4.5/lib/adapters/oak.ts
export const oakAdapter = () => {
    return async function (ctx: Oak.Context, next: Function) {
        ctx.render = async function <Data>(template: Template<Data>, data?: Data) {
            try {
                ctx.response.body = await template.render(data);
                ctx.response.headers.set("Content-Type", "text/html; charset=utf-8");
            } catch (e) {
                ctx.response.status = 404;
                console.log(e.message);
            }
        };

        await next();
    };
};

export const IndexTemplate = new Template<{ favoriteCake: string }>("index.eta.html");
export const RecipeTemplate = new Template("recipe.eta.html");
