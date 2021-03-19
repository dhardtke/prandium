import { dateFns } from "../../deps.ts";

// support different locales
export class DateHelper {
  public static INSTANCE: DateHelper = new DateHelper();

  private constructor() {
  }

  /**
   * Formats the given date
   * @param date the date to format
   * @param format the format to use
   * @return the formatted date
   */
  public format = (date: Date, format = "Pp"): string => {
    return dateFns.format(date, format, {
      locale: dateFns.locale.en,
    });
  };

  /**
   * Formats the given duration as string
   * @param duration the duration to format
   * @return the formatted duration
   */
  public formatDuration = <D>(duration: D): string => {
    // @ts-ignore formatDuration reads the second argument via "arguments" but the compiler doesn't know that
    return dateFns.formatDuration(duration, {
      locale: dateFns.locale.en,
    });
  };

  /**
   * Formats the given seconds as duration.
   * @param seconds the seconds to format
   */
  public formatSeconds = (seconds: number): string => {
    return this.formatDuration(
      dateFns.intervalToDuration({ start: 0, end: seconds * 1000 }),
    );
  };

  public api = {
    format: this.format,
    formatDuration: this.formatDuration,
    formatSeconds: this.formatSeconds,
  };
}
