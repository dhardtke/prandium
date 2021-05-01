export function removeParameterValue(
  url: URL,
  parameterName: string,
  parameterValue: unknown,
): string {
  const result = new URL(url.toString());
  const all = result.searchParams.getAll(parameterName);
  result.searchParams.delete(parameterName);
  all.filter((v) => v !== String(parameterValue)).forEach((val) =>
    result.searchParams.append(parameterName, val)
  );
  return result.toString();
}

export function removeParameter(url: URL, parameterName: string): string {
  const result = new URL(url.toString());
  result.searchParams.delete(parameterName);
  return result.toString();
}

// TODO rename functions for consistency
export function parameter(
  url: URL,
  parameterName: string,
  _default = "",
): string {
  return url.searchParams.get(parameterName) || _default;
}

export function parameterValues(
  url: URL,
  parameterName: string,
  _default = [],
): string[] {
  return url.searchParams.getAll(parameterName) || _default;
}

export function setParameter(
  url: URL,
  parameterName: string,
  parameterValue: string,
): URL {
  const result = new URL(url.toString());
  result.searchParams.set(parameterName, parameterValue);
  return result;
}
export function appendParameter(
  url: URL,
  parameterName: string,
  parameterValue: unknown,
): URL {
  const result = new URL(url.toString());
  result.searchParams.append(parameterName, String(parameterValue));
  return result;
}
