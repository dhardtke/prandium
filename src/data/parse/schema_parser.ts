import { Dom, SchemaRecipe } from "../../../deps.ts";

const TextHtml = "text/html";
const LdJson = "application/ld+json";

export class SchemaParser {
  private readonly document: Dom.Document;

  constructor(html: string) {
    const document = new Dom.DOMParser().parseFromString(html, TextHtml);
    if (!document) {
      throw new Error("TODO");
    }
    this.document = document!;
  }

  /**
   * Returns the first {@link Recipe} in the given HTML.
   */
  public findFirstRecipe(): SchemaRecipe | null {
    return this.findFirst<SchemaRecipe>("Recipe");
  }

  private findFirst<T>(type: string): T | null {
    const $scripts: Dom.Node[] = Array.from(
      this.document.querySelectorAll(`script[type="${LdJson}"]`),
    );
    for (const $script of $scripts) {
      const json = $script.textContent;
      if (json) {
        const parsed = JSON.parse(json);
        const candidates = Array.isArray(parsed) ? parsed : [parsed];
        for (const candidate of candidates) {
          if ("@type" in candidate && candidate["@type"] === type) {
            return candidate;
          }
        }
      }
    }
    return null;
  }
}
