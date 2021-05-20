import { fs, path } from "../../../deps.ts";
import { root } from "../../util.ts";

const AssetsDir = root("assets");

export const asset = {
  ifExists: (checked: string, _default: string): string => {
    if (fs.existsSync(path.join(AssetsDir, checked))) {
      return checked;
    }
    return _default;
  },
  modificationTimestamp: (filename: string): number | undefined => {
    try {
      const maybeMs = Deno.statSync(path.join(AssetsDir, filename)).mtime
        ?.getTime();
      return maybeMs && Math.trunc(maybeMs / 1000);
    } catch {
      return undefined;
    }
  },
};
