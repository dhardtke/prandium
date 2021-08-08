import { l } from "../../i18n/mod.ts";

const units: { unit: Intl.RelativeTimeFormatUnit; ms: number }[] = [
  { unit: "year", ms: 24 * 60 * 60 * 1000 * 365 },
  { unit: "month", ms: 24 * 60 * 60 * 1000 * 365 / 12 },
  { unit: "day", ms: 24 * 60 * 60 * 1000 },
  { unit: "hour", ms: 60 * 60 * 1000 },
  { unit: "minute", ms: 60 * 1000 },
  { unit: "second", ms: 1000 },
];

function closestUnit(
  millis: number,
): { unit: Intl.RelativeTimeFormatUnit; ms: number } {
  for (const { unit, ms } of units) {
    if (Math.abs(millis) >= ms || unit === "second") {
      return { unit, ms: Math.round(millis / ms) };
    }
  }
  throw new Error("Unreachable");
}

export const date = {
  /**
   * Formats the given date.
   * @param date the date to format
   * @param options the options to use for formatting
   * @return the formatted date
   */
  format: (date: Date, options?: Intl.DateTimeFormatOptions): string => {
    return new Intl.DateTimeFormat(l.meta.bcp47, options).format(date);
  },

  /**
   * Get language-sensitive relative time message from Dates.
   * @param relative  - the relative dateTime, generally is in the past or future
   * @param pivot     - the dateTime of reference, generally is the current time
   */
  formatRelative: (relative: Date | null, pivot: Date = new Date()): string => {
    if (!relative) return "";
    const elapsed = relative.getTime() - pivot.getTime();
    return date.relativeTimeFromElapsed(elapsed);
  },

  /**
   * Get language-sensitive relative time message from elapsed time.
   * @param elapsed   - the elapsed time in milliseconds
   */
  relativeTimeFromElapsed: (elapsed: number | undefined): string => {
    if (elapsed) {
      const { unit, ms } = closestUnit(elapsed);
      const rtf = new Intl.RelativeTimeFormat(l.meta.bcp47, {
        numeric: "auto",
      });
      return rtf.format(ms, unit);
    }
    return "";
  },

  /**
   * Get language-sensitive formatted number for the given seconds.
   * @param seconds the seconds
   */
  formatSeconds: (seconds: number | undefined): string => {
    if (seconds) {
      const { unit, ms } = closestUnit(seconds * 1000);
      return new Intl.NumberFormat(l.meta.bcp47, {
        style: "unit",
        unit: unit,
        unitDisplay: "long",
      }).format(ms);
    }
    return "";
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
