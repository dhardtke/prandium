import { en } from "../../i18n/en.ts";
import { LanguageId, LANGUAGES, setLanguage } from "../../i18n/mod.ts";
import { Middleware } from "../server/types.ts";

export const LanguageCookie = "PrandiumLanguage";

/**
 * Sets the language from the `lang` parameter (remembering it in a cookie) or from the cookie set by a previous request.
 */
export const languageMiddleware: Middleware = (req, next) => {
    let requestedLang: string | null = req.url.searchParams.get("lang");
    if (requestedLang) {
        req.cookies.set(LanguageCookie, requestedLang, { path: "/", httpOnly: true });
    } else {
        requestedLang = req.cookies.get(LanguageCookie);
    }
    const language = LANGUAGES[(requestedLang as LanguageId) || "en"] || en;
    setLanguage(language);
    return next();
};
