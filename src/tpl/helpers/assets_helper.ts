import { fs, path } from "../../../deps.ts";
import { root } from "../../util.ts";

export class AssetsHelper {
  public static INSTANCE: AssetsHelper = new AssetsHelper();

  private constructor() {
  }

  public ifExists = (checked: string, _default: string): string => {
    const COMPILED_ASSETS_DIR = root("assets", "dist");
    if (fs.existsSync(path.join(COMPILED_ASSETS_DIR, checked))) {
      return checked;
    }
    return _default;
  };

  public api = {
    ifExists: this.ifExists,
  };
}
