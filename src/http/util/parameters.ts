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

export function parameter(
  url: URL,
  parameterName: string,
  _default = "",
): string {
  return url.searchParams.get(parameterName) || _default;
}
