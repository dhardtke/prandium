import { dateFns } from "../../../deps.ts";

// TODO support different locales

export const date = {
  /**
   * Formats the given date.
   * @param date the date to format
   * @param format the format to use
   * @return the formatted date
   */
  format: (date: Date, format = "Pp"): string => {
    return dateFns.format(date, format, {
      locale: dateFns.locale.en,
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
      locale: dateFns.locale.en,
    });
  },

  /**
   * Formats the given seconds as duration.
   * @param seconds the seconds to format
   */
  formatSeconds: (seconds: number): string => {
    return date.formatDuration(
      dateFns.intervalToDuration({
        start: 0,
        end: seconds * 1000,
      }),
    );
  },

  /**
   * Formats the given date to indicate the duration from the current date.
   */
  formatDistanceToNow: (date: Date): string => {
    return dateFns.formatDistanceToNow(date, {
      addSuffix: true,
      locale: dateFns.locale.en,
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
    const formatter = new Intl.NumberFormat("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    return formatter.format(num);
  },
};
