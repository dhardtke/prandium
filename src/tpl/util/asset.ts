import { fs, path } from "../../../deps.ts";
import { root } from "../../util.ts";

const CompiledAssetsDir = root("assets", "dist");

export const asset = {
  ifExists: (checked: string, _default: string): string => {
    if (fs.existsSync(path.join(CompiledAssetsDir, checked))) {
      return checked;
    }
    return _default;
  },
  modificationTimestamp: (filename: string): number | undefined => {
    try {
      return Deno.statSync(path.join(CompiledAssetsDir, filename)).mtime
        ?.getTime();
    } catch {
      return undefined;
    }
  },
};
