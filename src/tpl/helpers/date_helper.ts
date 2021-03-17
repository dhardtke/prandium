import { dateFns, log, path } from "../../deps.ts";
import { root } from "../../util.ts";

export class DateHelper {
  public static INSTANCE: DateHelper = new DateHelper();

  private constructor() {
  }

  /**
   * Reads the SVG contents for an icon with the given name.
   * @param name the icon name, e.g. "arrow-right-short"
   */
  public f = (d: Date): string | undefined => {
    return dateFns.format(d, "MM/dd/yyyy", undefined);
  };

  public api = {
    f: this.f,
  };
}
