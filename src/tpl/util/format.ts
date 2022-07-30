import { l } from "../../i18n/mod.ts";

interface UnitWithTime {
    unit: Intl.RelativeTimeFormatUnit;
    ms: number;
}

const unitsWithTime: UnitWithTime[] = [
    { unit: "year", ms: 24 * 60 * 60 * 1000 * 365 },
    { unit: "month", ms: 24 * 60 * 60 * 1000 * 365 / 12 },
    { unit: "day", ms: 24 * 60 * 60 * 1000 },
    { unit: "hour", ms: 60 * 60 * 1000 },
    { unit: "minute", ms: 60 * 1000 },
    { unit: "second", ms: 1000 },
];

function closestUnit(
    millis: number,
): UnitWithTime {
    const unitWithTime = unitsWithTime.find(({ ms }) => Math.abs(millis) >= ms) || unitsWithTime[unitsWithTime.length - 1];
    return { unit: unitWithTime.unit, ms: Math.round(millis / unitWithTime.ms) };
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
    formatRelative: (relative?: Date, pivot: Date = new Date()): string => {
        if (!relative) {
            return "";
        }
        const elapsed = relative.getTime() - pivot.getTime();
        return date.relativeTimeFromElapsed(elapsed);
    },

    /**
     * Get language-sensitive relative time message from elapsed time.
     * @param elapsed   - the elapsed time in milliseconds
     */
    relativeTimeFromElapsed: (elapsed?: number): string => {
        if (typeof elapsed === "number") {
            const { unit, ms } = closestUnit(elapsed);
            const rtf = new Intl.RelativeTimeFormat(l.meta.bcp47, {
                numeric: "auto",
            });
            return rtf.format(ms, unit);
        }
        return "";
    },

    /**
     * Get language-sensitive formatted number for the given minutes.
     * @param minutes the minutes
     */
    formatMinutes: (minutes?: number): string => {
        if (typeof minutes === "number") {
            const { unit, ms } = closestUnit(minutes * 1000 * 60);
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
        const formatter = new Intl.NumberFormat(l.meta.bcp47, {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
        });
        return formatter.format(num);
    },
};
