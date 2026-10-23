import { styleText } from "node:util";

type Format = Parameters<typeof styleText>[0];

// like @std/fmt/colors, colors are always applied unless disabled via NO_COLOR (see https://no-color.org)
const enabled = !process.env.NO_COLOR;

function color(format: Format): (str: string) => string {
    return (str: string) => (enabled ? styleText(format, str, { validateStream: false }) : str);
}

export const red = color("red");
export const brightRed = color("redBright");
export const yellow = color("yellow");
export const gray = color("gray");
export const brightBlue = color("blueBright");
export const cyan = color("cyan");
export const brightCyan = color("cyanBright");
