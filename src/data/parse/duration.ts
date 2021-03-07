import {toInt} from "../../util.ts";

export interface Duration {
    years: number;
    months: number;
    weeks: number;
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
}

const NUMBERS = Array.from(Array(10).keys()).map(i => i + "");
const yearPattern = `(?<years>\\d{4})`;
const monthPattern = `(?<months>\\d{2})`;
const dayPattern = `(?<days>\\d{2})`;
const hourPattern = `(?<hours>\\d{2})`;
const minutePattern = `(?<minutes>\\d{2})`;
const secondPattern = `(?<seconds>\\d{2})`;

// PYYYYMMDDThhmmss
const dateTimePattern = new RegExp(`^P${yearPattern}${monthPattern}${dayPattern}T${hourPattern}${minutePattern}${secondPattern}$`);

// P[YYYY]-[MM]-[DD]T[hh]:[mm]:[ss].
const dateTimeExtendedPattern = new RegExp(`^P${yearPattern}-${monthPattern}-${dayPattern}T${hourPattern}:${minutePattern}:${secondPattern}$`);

/**
 * Parses the given Duration string into a Duration object.
 * @param iso8601duration the duration matching the ISO8601 specification
 * @link https://en.wikipedia.org/wiki/ISO_8601#Durations
 */
export function parseDuration(iso8601duration: string): Duration {
    if (iso8601duration[0] !== "P") {
        throw new Error("Duration must start with 'P'");
    }

    const exec = dateTimePattern.exec(iso8601duration) || dateTimeExtendedPattern.exec(iso8601duration);
    if (exec?.groups) {
        return {
            years: toInt(exec.groups.years),
            months: toInt(exec.groups.months),
            weeks: toInt(exec.groups.weeks),
            days: toInt(exec.groups.days),
            hours: toInt(exec.groups.hours),
            minutes: toInt(exec.groups.minutes),
            seconds: toInt(exec.groups.seconds)
        };
    }

    let tmp: string[] = [];
    let sawTime = false;
    const date: Record<"Y" | "M" | "W" | "D", string[]> = {
        "Y": [],
        "M": [],
        "W": [],
        "D": []
    }
    const time: Record<"H" | "M" | "S", string[]> = {
        "H": [],
        "M": [],
        "S": []
    }
    for (let i = 1; i < iso8601duration.length; i++) {
        const char = iso8601duration[i];
        if (NUMBERS.includes(char) || char === "." || char === ",") {
            tmp.push(char);
        } else if (!sawTime && char === "T") {
            if (tmp.length) {
                throw new Error(`Unexpected T: Expected designator.`);
            }
            sawTime = true;
        } else {
            const target = sawTime ? char in time && time : char in date && date;
            if (target) {
                // @ts-ignore
                target[char] = [...tmp];
                tmp.length = 0;
            } else {
                throw new Error(`Unexpected character ${char} at position ${i}`)
            }
        }
    }

    if (tmp.length || !Object.values({...date, ...time}).find(v => v.length)) {
        throw new Error(`Unexpected end of input.`);
    }

    const nonEmpty = Object.values({...date, ...time}).filter(v => v.length);
    const floatIdx = nonEmpty.findIndex(v => v.includes(".") || v.includes(","));
    if (floatIdx > -1 && floatIdx !== nonEmpty.length - 1) {
        throw new Error(`Only the smallest provided designator is allowed to be a float`);
    }

    const convert = (arr: string[]) => {
        return arr.length ? parseFloat(arr.join("").replace(",", ".")) : 0;
    }

    return {
        years: convert(date.Y),
        months: convert(date.M),
        weeks: convert(date.W),
        days: convert(date.D),
        hours: convert(time.H),
        minutes: convert(time.M),
        seconds: convert(time.S)
    };
}