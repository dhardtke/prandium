export function removeUrlParameterValue(url: URL, parameterName: string, value: string) {
  const all = url.searchParams.getAll(parameterName);
  url.searchParams.delete(parameterName);
  all.filter((v) => v !== value).forEach((val) => url.searchParams.append(parameterName, val));
}
