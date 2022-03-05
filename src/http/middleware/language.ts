import { Oak } from "../../../deps-oak.ts";
import { en } from "../../i18n/en.ts";
import { LanguageId, LANGUAGES, setLanguage } from "../../i18n/mod.ts";
import { AppState } from "../webserver.ts";

const LanguageCookie = "PrandiumLanguage";

export async function languageMiddleware(
  ctx: Oak.Context<AppState>,
  next: () => Promise<unknown>,
) {
  let requestedLang: string | null | undefined = ctx.request.url.searchParams
    .get("lang");
  if (requestedLang) {
    ctx.cookies.set(LanguageCookie, requestedLang);
  } else {
    requestedLang = await ctx.cookies.get(LanguageCookie);
  }
  const language = LANGUAGES[requestedLang as LanguageId || "en"] || en;
  setLanguage(language);
  await next();
}
