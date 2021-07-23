// deno-fmt-ignore-file
import { l } from "../../../i18n/mod.ts";
import { e, html } from "../../mod.ts";
import { asset } from "../../util/asset.ts";
import { Favicons } from "./favicons.ts";
import { Navbar } from "./navbar.ts";

interface PageType {
  minifying: boolean;
  currentUrl: URL;
  authorization: string | null;

  (title?: string): (body: string) => string;
}

const Page: PageType = (title?: string) =>
  (body: string) => {
    const stylesheet = asset.ifExists("dist/index.min.css", "dist/index.css");
    const javascript = asset.ifExists("dist/index.min.js", "dist/index.js");

    const markup = html`
      <!DOCTYPE html>
      <html lang="${l.meta.id}" data-authorization="${e(Page.authorization)}" class="preload">
      <style>
        html {
          display: none
        }

        .preload * {
          transition: none !important
        }</style>
      <script>
        document.documentElement.classList.toggle("dark", localStorage.getItem("PRANDIUM_DARK_MODE") === "true");
        document.documentElement.classList.remove("preload");
      </script>
      <meta charset="utf-8">
      <meta name="color-scheme" content="dark light">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      ${Favicons()}

      <title>${e(title) ?? e(l.appName)}</title>

      <link rel="stylesheet" href="/assets/${stylesheet}?${
        asset.modificationTimestamp(stylesheet)
      }">
      <script src="/assets/${javascript}?${
        asset.modificationTimestamp(javascript)
      }" async type="module"></script>

      ${Navbar()}

      <main class="container-xxl">
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

export { Page };
