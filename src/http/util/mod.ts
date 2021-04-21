import { Oak } from "../../../deps.ts";

export function urlWithParams(
  url: string | URL,
  params: { [name: string]: unknown },
  base?: URL,
): URL {
  const source = new URL(url.toString(), base);
  for (const key of Object.keys(params)) {
    source.searchParams.append(key, "" + params[key]);
  }
  return source;
}

export type FormData<K extends string> = Record<
  K,
  (string | Oak.FormDataFile)[]
>;

/**
 * Oak specifically mentions how FormDataReader's .read() method does not support collecting
 * multiple values if a field occurs more than once. This method fixes this by collecting all fields with the same
 * name in an array.
 */
export async function collectFormData<K extends string>(
  formDataReader: Oak.FormDataReader,
): Promise<FormData<K>> {
  const data: FormData<K> = {} as FormData<K>;
  for await (const [key, value] of formDataReader.stream()) {
    if (!data[key as K]) {
      data[key as K] = [];
    }
    data[key as K].push(value);
  }
  return data;
}
