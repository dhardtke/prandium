export const parameters = (url: URL | string) => {
  const result = new URL(url.toString());

  return {
    get: (
      name: string,
      _default = "",
    ): string => {
      return result.searchParams.get(name) || _default;
    },

    getAll: (
      name: string,
      _default: string[] = [],
    ): string[] => {
      return result.searchParams.has(name)
        ? result.searchParams.getAll(name)
        : _default;
    },

    set: (
      name: string,
      value: string,
    ): URL => {
      result.searchParams.set(name, value);
      return result;
    },

    append: (
      name: string,
      value: unknown,
    ): URL => {
      result.searchParams.append(name, String(value));
      return result;
    },

    remove: (...names: string[]): string => {
      names.forEach((name) => result.searchParams.delete(name));
      return result.toString();
    },

    removeSingleValue: (name: string, value: unknown): string => {
      const all = result.searchParams.getAll(name);
      result.searchParams.delete(name);
      all.filter((v) => v !== String(value)).forEach((val) =>
        result.searchParams.append(name, val)
      );
      return result.toString();
    },
  };
};
