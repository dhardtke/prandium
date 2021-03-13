import { Dom, Recipe } from "../../deps.ts";

const TEXT_HTML = "text/html";
const LD_JSON = "application/ld+json";

/**
 * Returns the first {@link Recipe} in the given HTML.
 */
export function findFirstRecipe(html: string): Recipe | null {
  const domParser = new Dom.DOMParser();
  const document = domParser.parseFromString(html, TEXT_HTML);
  if (!document) {
    throw new Error("TODO");
  }
  const $scripts = document.querySelectorAll(`script[type="${LD_JSON}"]`);
  for (const $script of $scripts) {
    const json = $script.textContent;
    if (json) {
      const parsed = JSON.parse(json);
      const candidates = Array.isArray(parsed) ? parsed : [parsed];
      for (const candidate of candidates) {
        if ("@type" in candidate && candidate["@type"] === "Recipe") {
          return candidate;
        }
      }
    }
  }
  return null;
}
