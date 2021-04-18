import { root } from "../src/util.ts";

const icons = new Set([
  "arrow-left-short",
  "arrow-right-short",
  "journal-richtext",
  "moon-fill",
  "moon",
  "search",
  "funnel",
  "battery-half",
  "layout-wtf",
  "alarm",
  "clock-fill",
  "link-45deg",
  "cloud-arrow-down-fill",
  "check-square-fill",
  "x",
  "arrow-down",
  "arrow-up",
  "arrow-left",
  "x-circle-fill",
  "bar-chart",
  "star",
  "star-fill",
  "star-half",
  "people",
  "pencil",
  "three-dots",
  "trash",
  "plus-square",
]);
const source = root("assets/node_modules/bootstrap-icons/bootstrap-icons.svg");
const target = root("assets/icons.svg");

const glyphs: string[] = [];

let contents = await Deno.readTextFile(source);
contents = contents.substring(
  contents.indexOf("<symbol"),
  contents.lastIndexOf("</symbol>"),
);
const allGlyphs: { [iconName: string]: string } = {};
const ID_PATTERN = /id=["'](.*?)["']/;

for (const symbol of contents.split("</symbol>")) {
  const source = `${symbol}</symbol>`;
  const match = source.match(ID_PATTERN);
  if (match) {
    allGlyphs[match[1]] = source;
  } else {
    throw new Error(`Could not extract ID from ${source}`);
  }
}

for (const icon of icons) {
  const glyph = allGlyphs[icon];
  if (!glyph) {
    throw new Error(`Can't find glyph for icon ${icon}`);
  }
  glyphs.push(glyph.replace(' xmlns="http://www.w3.org/2000/svg"', ""));
}

await Deno.writeTextFile(
  target,
  `<svg xmlns="http://www.w3.org/2000/svg">${glyphs.join("")}</svg>`,
);
