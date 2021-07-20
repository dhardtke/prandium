import { dateFns } from "../../../deps.ts";
import { l } from "../../i18n/mod.ts";

export const date = {
  /**
   * Formats the given date.
   * @param date the date to format
   * @param format the format to use
   * @return the formatted date
   */
  format: (date: Date, format = "Pp"): string => {
    return dateFns.format(date, format, {
      locale: l.meta.dateFns,
    });
  },

  /**
   * Formats the given duration as string.
   * @param duration the duration to format
   * @return the formatted duration
   */
  formatDuration: <D>(duration: D): string => {
    // @ts-ignore formatDuration reads the second argument via "arguments" but the compiler doesn't know that
    return dateFns.formatDuration(duration, {
      locale: l.meta.dateFns,
    });
  },

  /**
   * Formats the given seconds as duration.
   * @param seconds the seconds to format
   */
  formatSeconds: (seconds?: number): string => {
    try {
      return date.formatDuration(
        dateFns.intervalToDuration({
          start: 0,
          end: (seconds || 0) * 1000,
          locale: l.meta.dateFns,
        }),
      );
    } catch {
      // errors can occur if the given number is way to large or small to be parsed into a Date
      // see https://262.ecma-international.org/11.0/#sec-time-values-and-time-range
      return "";
    }
  },

  /**
   * Formats the given date to indicate the duration from the current date.
   */
  formatDistanceToNow: (date: Date): string => {
    return dateFns.formatDistanceToNow(date, {
      addSuffix: true,
      locale: l.meta.dateFns,
    });
  },
};

export const number = {
  /**
   * Formats the given number to a string with the given amount of decimals.
   */
  format: (num?: number, decimals = 2): string => {
    if (!num) {
      return "";
    }
    // deno-lint-ignore no-undef See https://github.com/denoland/deno/issues/9896
    const formatter = new Intl.NumberFormat(l.meta.bcp47, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    return formatter.format(num);
  },
};
