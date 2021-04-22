export function html(
  strings: TemplateStringsArray,
  ...values: unknown[]
): string {
  const parts: string[] = [strings[0]];

  const maybeAdd = (value: unknown) => {
    if (value) {
      parts.push(String(value));
    }
  };

  for (let i = 0; i < values.length; i++) {
    if (values[i] instanceof Array) {
      (values[i] as unknown[]).forEach(maybeAdd);
    } else {
      maybeAdd(values[i]);
    }
    parts.push(strings[i + 1]);
  }

  return parts.join("").trim();
}

/**
 * Escapes the given string to be safe to be included in HTML.
 * @param str the string to escape
 */
export function e(str: unknown): string {
  if (!str) {
    return "";
  }
  return String(str).replace(
    /[&<>'"]/g,
    (tag) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "'": "&#39;",
        "\"": "&quot;",
      }[tag])!,
  );
}
