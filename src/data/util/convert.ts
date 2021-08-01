import { NUMBERS } from "./constants.ts";

export function toNumber(s?: string, _default = 0): number {
  if (s === undefined) {
    return _default;
  }
  const parsed = parseInt(s, 10);
  if (isNaN(parsed)) {
    return _default;
  }
  return parsed;
}

export function toDate(source?: Date | string, _default = new Date()): Date {
  if (source === undefined) {
    return _default;
  }
  if (source instanceof Date) {
    return source;
  }
  const purelyNumeric = [...source].every((char) => NUMBERS.includes(char));
  const parsed = new Date(purelyNumeric ? toNumber(source, NaN) : source);
  if (isNaN(parsed.getTime())) {
    return _default;
  }
  return parsed;
}

const SnakeCasePattern = /_([a-z])/g;

export function toCamelCase<T, O>(obj: O): T {
  // based on https://stackoverflow.com/a/58257506
  if (typeof obj === "object") {
    if (Array.isArray(obj)) {
      return obj.map(toCamelCase) as unknown as T;
    }
    return Object
      .entries(obj)
      .reduce((acc, [key, val]) => {
        const modifiedKey = key.replace(
          SnakeCasePattern,
          (g) => g[1].toUpperCase(),
        );
        const modifiedVal = typeof val === "object" && val !== null
          ? toCamelCase(val as unknown)
          : val;
        return {
          ...acc,
          ...{ [modifiedKey]: modifiedVal },
        };
      }, {} as T);
  }
  return obj as unknown as T;
}

export function pushAll<T>(source: T[], target: T[]): T[] {
  source.forEach((el) => target.push(el));
  return target;
}
