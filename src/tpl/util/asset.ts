import { fs, path } from "../../../deps.ts";
import { root } from "../../shared/util.ts";

const AssetsDir = root("out/assets");

export const asset = {
  ifExists: (checked: string, _default: string): string => {
    if (fs.existsSync(path.join(AssetsDir, checked))) {
      return checked;
    }
    return _default;
  },
};
