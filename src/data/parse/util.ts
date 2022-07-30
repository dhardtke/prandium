import { toInt } from "../util/convert.ts";

export function first<T>(
    value?: /*SchemaValue<T>*/ readonly unknown[] | unknown,
): T | undefined {
    if (!value) {
        return undefined;
    }
    return Array.isArray(value) ? value[0] as unknown as T : value as unknown as T;
}

export function ensureArray<T>(
    value?: /*SchemaValue<T>*/ readonly unknown[] | unknown,
): T[] {
    if (!value) {
        return [];
    }
    return Array.isArray(value) ? value as unknown as T[] : [value] as unknown as T[];
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
