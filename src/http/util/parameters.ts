import { Oak } from "../../../deps_oak.ts";

export interface ParametersBuilder {
  get(name: string, _default?: string): string;

  getAll(name: string, _default?: string[]): string[];

  set(name: string, value: string): ParametersBuilder;

  append(name: string, value: unknown): ParametersBuilder;

  remove(...names: string[]): ParametersBuilder;

  removeSingleValue(name: string, value: unknown): ParametersBuilder;

  toString(): string;
}

export const parameters = (
  url: URL | string | Oak.Context,
): ParametersBuilder => {
  const result = new URL(
    (url instanceof Oak.Context ? url.request.url : url).toString(),
  );

  const builder = {
    get(
      name: string,
      _default = "",
    ): string {
      return result.searchParams.get(name) || _default;
    },

    getAll(
      name: string,
      _default: string[] = [],
    ): string[] {
      return result.searchParams.has(name) ? result.searchParams.getAll(name) : _default;
    },

    set(
      name: string,
      value: string,
    ): ParametersBuilder {
      result.searchParams.set(name, value);
      return builder;
    },

    append(
      name: string,
      value: unknown,
    ): ParametersBuilder {
      result.searchParams.append(name, String(value));
      return builder;
    },

    remove(
      ...names: string[]
    ): ParametersBuilder {
      names.forEach((name) => result.searchParams.delete(name));
      return builder;
    },

    removeSingleValue(name: string, value: unknown): ParametersBuilder {
      const all = result.searchParams.getAll(name);
      result.searchParams.delete(name);
      all.filter((v) => v !== String(value)).forEach((val) => result.searchParams.append(name, val));
      return builder;
    },
    toString(): string {
      return result.toString();
    },
  };
  return builder;
};
