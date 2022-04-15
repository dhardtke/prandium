// deno-fmt-ignore-file
import { l } from "../../../i18n/mod.ts";
import { e, html } from "../../mod.ts";
import { asset } from "../../util/asset.ts";
import { Favicons } from "./favicons.ts";
import { Header } from "./header.ts";

interface PageType {
  minifying: boolean;
  currentUrl: URL;
  authorization: string | null;
  dark: boolean;

  (title?: string): (body: string) => string;
}

const Page: PageType = (title?: string) =>
  (body: string) => {
    const stylesheet = asset.ifExists("index.min.css", "index.css");
    const javascript = asset.ifExists("index.min.js", "index.js");

    const markup = html`
      <!DOCTYPE html>
      <html lang="${l.meta.id}" data-authorization="${e(Page.authorization)}" class="preload${Page.dark && " dark"}">
      <style>
        html {
          display: none
        }

        .preload * {
          transition: none !important
        }</style>
      <script>
        document.documentElement.classList.remove("preload");
        window.addEventListener("load", function () {
          if ("serviceWorker" in navigator) {
            navigator.serviceWorker.register("/sw.js");
          }
        });
      </script>
      <meta charset="utf-8">
      <meta name="color-scheme" content="dark light">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      ${Favicons()}

      <title>${e(title) ?? e(l.appName)}</title>

      <link rel="stylesheet" href="/assets/${stylesheet}">
      <script src="/assets/${javascript}" async type="module"></script>

      ${Header()}

      <main class="container">
        ${body}
      </main>
      </html>
    `;

    return Page.minifying
      ? markup.replace(/>\s+|\s+</g, (m) => m.trim())
      : markup;
  };

/**
 * Determines whether the markup should be minified or not.
 */
Page.minifying = false;

/**
 * The current value of the "Authorization" request header.
 */
Page.authorization = null;

/**
 * The request's current URL.
 */
Page.currentUrl = new URL("https://localhost");

/**
 * Whether the dark mode is currently enabled.
 */
Page.dark = false;

export { Page };
