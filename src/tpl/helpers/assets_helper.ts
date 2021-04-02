import { fs, path } from "../../../deps.ts";
import { root } from "../../util.ts";

const COMPILED_ASSETS_DIR = root("assets", "dist");

export class AssetsHelper {
  public static INSTANCE: AssetsHelper = new AssetsHelper();

  private constructor() {
  }

  public ifExists = (checked: string, _default: string): string => {
    if (fs.existsSync(path.join(COMPILED_ASSETS_DIR, checked))) {
      return checked;
    }
    return _default;
  };

  public modificationTimestamp = (filename: string): number | undefined => {
    return Deno.statSync(path.join(COMPILED_ASSETS_DIR, filename)).mtime
      ?.getTime();
  };

  public api = {
    ifExists: this.ifExists,
    modificationTimestamp: this.modificationTimestamp,
  };
}
