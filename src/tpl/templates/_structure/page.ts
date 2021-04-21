import { asset } from "../../util/asset.ts";
import { t } from "../../util/translation.ts";
import { e, html } from "../../mod.ts";
import { Favicons } from "./favicons.ts";
import { Navbar } from "./navbar.ts";

const Page = (title?: string) =>
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

    <title>${e(title) ?? e(t("appName"))}</title>

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

export { Page };
