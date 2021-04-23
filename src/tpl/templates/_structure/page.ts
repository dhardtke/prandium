// deno-fmt-ignore-file
import { l } from "../../../i18n/mod.ts";
import { e, html } from "../../mod.ts";
import { asset } from "../../util/asset.ts";
import { Favicons } from "./favicons.ts";
import { Navbar } from "./navbar.ts";

interface PageType {
  minifying: boolean;
  currentUrl: URL;

  (title?: string): (body: string) => string;
}

const Page: PageType = (title?: string) =>
  (body: string) => {
    const stylesheet = asset.ifExists("index.min.css", "index.css");
    const javascript = asset.ifExists("index.min.js", "index.js");

    const markup = html`
      <!DOCTYPE html>
      <html lang="en">
      <style>html {
        display: none;
      }</style>
      <script>document.documentElement.classList.toggle("dark", localStorage.getItem("COOK_GUIDE_DARK_MODE") === "true")</script>
      <meta charset="utf-8"/>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      ${Favicons()}

      <title>${e(title) ?? e(l.appName)}</title>

      <link rel="stylesheet" href="/assets/dist/${stylesheet}?${
        asset.modificationTimestamp(stylesheet)
      }">
      <script src="/assets/dist/${javascript}?${
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
 * The request's current URL.
 */
Page.currentUrl = new URL("https://localhost");

export { Page };
