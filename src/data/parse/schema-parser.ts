import { log, SchemaRecipe } from "../../../deps.ts";

const LdJson = "application/ld+json";

const ScriptClose = "</script>";
const ScriptOpen = "<script";
const AngleBracketClose = ">";

export interface ParseHtmlToSchema {
    findFirstRecipe(): SchemaRecipe | null;
}

export class SchemaParser implements ParseHtmlToSchema {
    constructor(private readonly html: string) {
        this.html = html;
    }

    // deno-lint-ignore no-explicit-any
    private static getObjects(parsed: any): { [k: string]: unknown }[] {
        if (Array.isArray(parsed)) {
            return parsed;
        }
        if ("@graph" in parsed && Array.isArray(parsed["@graph"])) {
            return parsed["@graph"];
        }
        return [parsed];
    }

    /**
     * Returns the first {@link SchemaRecipe} in the given HTML.
     */
    public findFirstRecipe(): SchemaRecipe | null {
        return this.findFirst<SchemaRecipe>("Recipe");
    }

    private *collectJsons(): Generator<string> {
        for (
            let pos = this.html.indexOf(ScriptOpen);
            pos !== -1;
            pos = this.html.indexOf(ScriptOpen, pos)
        ) {
            const scriptOpen = pos;
            const openingScriptEnd = this.html.indexOf(AngleBracketClose, pos);
            pos = openingScriptEnd;
            if (openingScriptEnd !== -1) {
                const scriptEnd = this.html.indexOf(ScriptClose, openingScriptEnd);
                pos = scriptEnd;
                if (scriptEnd !== -1) {
                    const scriptAttributes = this.html.substring(
                        scriptOpen,
                        openingScriptEnd + AngleBracketClose.length,
                    );
                    if (
                        ["", "'", '"'].some((char) => scriptAttributes.includes(`type=${char}${LdJson}${char}`))
                    ) {
                        yield this.html.substring(
                            openingScriptEnd + AngleBracketClose.length,
                            scriptEnd,
                        );
                    }
                }
            }
        }
    }

    private findFirst<T>(type: string): T | null {
        for (const json of this.collectJsons()) {
            try {
                const parsed = JSON.parse(json);
                const candidates = SchemaParser.getObjects(parsed);
                for (const candidate of candidates) {
                    if ("@type" in candidate && candidate["@type"] === type) {
                        delete candidate["@context"];
                        return candidate as unknown as T;
                    }
                }
            } catch (e) {
                log.warn(`Skipping invalid JSON ${json}`, e);
            }
        }

        return null;
    }
}
