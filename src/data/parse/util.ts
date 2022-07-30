import { toInt } from "../util/convert.ts";

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
            return toInt(match[0]);
        }
    }
    return undefined;
}
