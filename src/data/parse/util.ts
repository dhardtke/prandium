import { toNumber } from "../util/convert.ts";

export function first<T>(
  value?: /*SchemaValue<T>*/ readonly T[] | T,
): T | undefined {
  if (!value) {
    return undefined;
  }
  return Array.isArray(value) ? value[0] : value;
}

export function ensureArray<T>(
  value?: /*SchemaValue<T>*/ readonly T[] | T,
): T[] {
  if (!value) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
}

const NUMBER = /(\d+)/;

export function extractNumber(source?: string | number): number | undefined {
  if (source) {
    if (typeof source === "number") {
      return source;
    }
    const match = source.match(NUMBER);
    if (match) {
      return toNumber(match[0], undefined);
    }
  }
  return undefined;
}

export function isIdReference<T>(obj: T): boolean {
  return "id" in obj && Object.keys(obj).length === 1;
}

export function cast<T, U>(
  obj: T,
  guard: (t: NonNullable<T>) => boolean,
): U | undefined {
  return obj && guard(obj!) ? obj as unknown as U : undefined;
}

export type IdReference = { "@id": string };

export function excludeIdReference<T extends IdReference>(
  obj: T | IdReference | undefined,
): Exclude<T, IdReference> | undefined {
  return !obj || isIdReference(obj)
    ? undefined
    : obj as Exclude<T, IdReference>;
}
