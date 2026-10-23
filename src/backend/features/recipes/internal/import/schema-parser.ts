const LD_JSON = 'application/ld+json';
const SCRIPT_OPEN = '<script';
const SCRIPT_CLOSE = '</script>';
const TAG_END = '>';

export type SchemaObject = Record<string, unknown>;

export interface ParseHtmlToSchema {
  findFirstRecipe: () => SchemaObject | null;
}

function isObject(value: unknown): value is SchemaObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function candidates(parsed: unknown): unknown[] {
  if (Array.isArray(parsed)) {
    return parsed;
  }
  const graph = isObject(parsed) ? parsed['@graph'] : undefined;
  return Array.isArray(graph) ? graph : [parsed];
}

function hasType(candidate: SchemaObject, type: string): boolean {
  const declared = candidate['@type'];
  return declared === type || (Array.isArray(declared) && declared.includes(type));
}

/** Finds schema.org objects in a page's JSON-LD scripts, without a DOM. */
export class SchemaParser implements ParseHtmlToSchema {
  readonly #html: string;

  constructor(html: string) {
    this.#html = html;
  }

  findFirstRecipe(): SchemaObject | null {
    return this.#findFirst('Recipe');
  }

  *#jsonScripts(): Generator<string> {
    const html = this.#html;
    for (let pos = html.indexOf(SCRIPT_OPEN); pos !== -1; pos = html.indexOf(SCRIPT_OPEN, pos)) {
      const open = pos;
      const openEnd = html.indexOf(TAG_END, pos);
      pos = openEnd;
      if (openEnd === -1) {
        continue;
      }
      const close = html.indexOf(SCRIPT_CLOSE, openEnd);
      pos = close;
      if (close === -1) {
        continue;
      }
      const attributes = html.substring(open, openEnd + TAG_END.length);
      if (['', "'", '"'].some((quote) => attributes.includes(`type=${quote}${LD_JSON}${quote}`))) {
        yield html.substring(openEnd + TAG_END.length, close);
      }
    }
  }

  #findFirst(type: string): SchemaObject | null {
    for (const json of this.#jsonScripts()) {
      let parsed: unknown;
      try {
        parsed = JSON.parse(json);
      } catch {
        // Pages carry broken JSON-LD next to good one; the next script may still hold the recipe.
        continue;
      }
      for (const candidate of candidates(parsed)) {
        if (isObject(candidate) && hasType(candidate, type)) {
          const { '@context': _context, ...rest } = candidate;
          return rest;
        }
      }
    }
    return null;
  }
}
