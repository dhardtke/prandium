import { styleText } from "node:util";

type Format = Parameters<typeof styleText>[0];

function color(format: Format): (str: string) => string {
    return (str: string) => styleText(format, str, { validateStream: false });
}

export const red = color("red");
export const brightRed = color("redBright");
export const yellow = color("yellow");
export const gray = color("gray");
export const brightBlue = color("blueBright");
export const cyan = color("cyan");
export const brightCyan = color("cyanBright");
