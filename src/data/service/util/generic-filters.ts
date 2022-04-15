import { Filter, placeholders } from "../../util/sql.ts";

export function idsFilter(ids?: number[]): Filter {
  return {
    active: Boolean(ids?.length),
    sql: () => `id IN (${placeholders(ids)})`,
    bindings: () => ids!,
  };
}
