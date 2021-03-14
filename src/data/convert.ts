export function toDate(source?: Date | string, _default = new Date()): Date {
  if (source === undefined) {
    return _default;
  }
  if (source instanceof Date) {
    return source;
  }
  return new Date(source);
}

const SNAKE_CASE_PATTERN = /_([a-z])/g;

export function toCamelCase<T, O>(obj: O): T {
  // based on https://stackoverflow.com/a/58257506
  return Object
    .entries(obj)
    .reduce((acc, [key, val]) => {
      const modifiedKey = key.replace(
        SNAKE_CASE_PATTERN,
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

export function removePrefix<T, O>(obj: O, prefix: string): T {
  return Object
    .entries(obj)
    .reduce((acc, [key, val]) => {
      const modifiedKey = key.replaceAll(prefix, "");
      const modifiedVal = typeof val === "object" && val !== null
      ? removePrefix(val as unknown, prefix)
        : val;
      return {
        ...acc,
        ...{[modifiedKey]: modifiedVal},
      };
    }, {} as T);
}

export function extractPrefixed<T, O>(obj: O, prefix: string, removePrefix = true): T {
  return Object
    .entries(obj)
    .reduce((acc, [key, val]) => {
      if (!key.startsWith(prefix)) {
        return acc;
      }
      const modifiedKey = removePrefix ? key.replaceAll(prefix, "") : key;
      const modifiedVal = typeof val === "object" && val !== null
        ? extractPrefixed(val as unknown, prefix, removePrefix)
        : val;
      return {
        ...acc,
        ...{[modifiedKey]: modifiedVal},
      };
    }, {} as T);
}

export function toArray<S, T>(
  data: Generator<S>,
  mapper: (src: S) => T = (src) => src as unknown as T,
): T[] {
  return Array.from(data)
    .map((src: S) => mapper(src));
}

export function map<S, T>(
  maybe: S,
  mapper: (src: S) => T = (src) => src as unknown as T,
): T | undefined {
  return maybe ? mapper(maybe) : undefined;
}
