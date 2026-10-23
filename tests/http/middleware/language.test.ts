import { afterEach, describe, expect, test } from "bun:test";
import { de } from "../../../src/i18n/de.ts";
import { en } from "../../../src/i18n/en.ts";
import { l, setLanguage } from "../../../src/i18n/mod.ts";
import { LanguageCookie, languageMiddleware } from "../../../src/http/middleware/language.ts";
import { compose } from "../../../src/http/server/compose.ts";
import { cookiesMiddleware } from "../../../src/http/server/cookies.ts";
import { toAppRequest } from "../../../src/http/server/request.ts";

describe("languageMiddleware", () => {
    const handler = compose([cookiesMiddleware, languageMiddleware], () => new Response(l.meta.id));

    afterEach(() => {
        setLanguage(en);
    });

    test("Given ?lang=de Then the language is German and a cookie remembers it", async () => {
        const response = await handler(toAppRequest(new Request("http://localhost/?lang=de")));

        expect(await response.text()).toEqual(de.meta.id);
        const setCookie = response.headers.get("Set-Cookie")!;
        expect(setCookie).toStartWith(`${LanguageCookie}=de`);
        expect(setCookie).toContain("Path=/");
        expect(setCookie).toContain("HttpOnly");
    });

    test("Given the language cookie Then the language is read from it and no cookie is set", async () => {
        const response = await handler(toAppRequest(new Request("http://localhost/", { headers: { Cookie: `${LanguageCookie}=de` } })));

        expect(await response.text()).toEqual(de.meta.id);
        expect(response.headers.get("Set-Cookie")).toBeNull();
    });

    test("Given neither parameter nor cookie Then the language is English", async () => {
        setLanguage(de);

        const response = await handler(toAppRequest(new Request("http://localhost/")));

        expect(await response.text()).toEqual(en.meta.id);
    });

    test("Given an unknown language Then the language is English", async () => {
        const response = await handler(toAppRequest(new Request("http://localhost/?lang=xx")));

        expect(await response.text()).toEqual(en.meta.id);
    });
});
