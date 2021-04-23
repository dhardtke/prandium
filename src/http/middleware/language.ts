import { Oak } from "../../../deps.ts";
import { en } from "../../i18n/en.ts";
import { LANGUAGES, setLanguage } from "../../i18n/mod.ts";
import { AppState } from "../webserver.ts";

const LANGUAGE_COOKIE = "CookGuideLanguage";

export async function languageMiddleware(
  ctx: Oak.Context<AppState>,
  next: () => Promise<void>,
) {
  let requestedLang: string | null | undefined = ctx.request.url.searchParams
    .get("lang");
  if (requestedLang) {
    ctx.cookies.set(LANGUAGE_COOKIE, requestedLang);
  } else {
    requestedLang = ctx.cookies.get(LANGUAGE_COOKIE);
  }
  const language = LANGUAGES[requestedLang || "en"] || en;
  setLanguage(language);
  await next();
}
