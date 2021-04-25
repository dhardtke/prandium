import { Oak } from "../../../deps.ts";
import { en } from "../../i18n/en.ts";
import { LanguageId, LANGUAGES, setLanguage } from "../../i18n/mod.ts";
import { AppState } from "../webserver.ts";

const LanguageCookie = "CookGuideLanguage";

export async function languageMiddleware(
  ctx: Oak.Context<AppState>,
  next: () => Promise<void>,
) {
  let requestedLang: string | null | undefined = ctx.request.url.searchParams
    .get("lang");
  if (requestedLang) {
    ctx.cookies.set(LanguageCookie, requestedLang);
  } else {
    requestedLang = ctx.cookies.get(LanguageCookie);
  }
  const language = LANGUAGES[requestedLang as LanguageId || "en"] || en;
  setLanguage(language);
  await next();
}
