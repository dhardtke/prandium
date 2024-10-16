import { NUMBERS_ONE_TO_TEN } from "./constants.ts";

function toNumber(str: string | null | undefined, parseFn: (str: string) => number, _default = 0) {
    if (str === null || str === undefined) {
        return _default;
    } else {
        const parsed = parseFn(str);
        if (isNaN(parsed)) {
            return _default;
        } else {
            return parsed;
        }
    }
}

export function toInt(str: string | null | undefined, _default = 0): number {
    return toNumber(str, (n) => parseInt(n, 10), _default);
}

export function toFloat(str: string | undefined, _default = 0.0): number {
    return toNumber(str, parseFloat, _default);
}

export function toDate(source?: Date | string, _default = new Date()): Date {
    if (source === undefined) {
        return _default;
    }
    if (source instanceof Date) {
        return source;
    }
    const purelyNumeric = [...source].every((char) => NUMBERS_ONE_TO_TEN.includes(char));
    const parsed = new Date(purelyNumeric ? toInt(source, NaN) : source);
    if (isNaN(parsed.getTime())) {
        return _default;
    }
    return parsed;
}

export function tupleToDate(datePortion: string, timePortion: string): Date {
    const [year, month, day] = String(datePortion).split("-").map(toInt);
    const [hour, minute, second] = String(timePortion).split(":").map(toInt);
    const date = new Date(year, month - 1, day);
    date.setHours(hour, minute, second);
    return date;
}

const SnakeCasePattern = /_([a-z])/g;

export function toCamelCase<T, O>(obj: O): T {
    // based on https://stackoverflow.com/a/58257506
    if (typeof obj === "object") {
        if (Array.isArray(obj)) {
            return obj.map(toCamelCase) as unknown as T;
        }
        return Object
            .entries(obj as Record<string, unknown>)
            .reduce((acc, [key, val]) => {
                const modifiedKey = key.replace(
                    SnakeCasePattern,
                    (g) => g[1].toUpperCase(),
                );
                const modifiedVal = typeof val === "object" && val !== null ? toCamelCase(val as unknown) : val;
                return {
                    ...acc,
                    ...{ [modifiedKey]: modifiedVal },
                };
            }, {} as T);
    }
    return obj as unknown as T;
}
