import { fs, path } from "../../../deps.ts";
import { root } from "../../util.ts";

const COMPILED_ASSETS_DIR = root("assets", "dist");

export const asset = {
  ifExists: (checked: string, _default: string): string => {
    if (fs.existsSync(path.join(COMPILED_ASSETS_DIR, checked))) {
      return checked;
    }
    return _default;
  },
  modificationTimestamp: (filename: string): number | undefined => {
    return Deno.statSync(path.join(COMPILED_ASSETS_DIR, filename)).mtime
      ?.getTime();
  },
};
