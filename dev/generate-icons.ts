import { root } from "../src/shared/util.ts";
import { ICONS } from "../src/tpl/templates/_components/icon.tsx";

const icons = new Set(ICONS);

const source = root("assets/node_modules/bootstrap-icons/bootstrap-icons.svg");
const target = root("assets/icons.svg");

const glyphs: string[] = [];

let contents = await Deno.readTextFile(source);
contents = contents.substring(
  contents.indexOf("<symbol"),
  contents.lastIndexOf("</symbol>"),
);
const allGlyphs: { [iconName: string]: string } = {};
const IdPattern = /id=["'](.*?)["']/;

for (const symbol of contents.split("</symbol>")) {
  const source = `${symbol}</symbol>`;
  const match = source.match(IdPattern);
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

  glyphs.push(
    glyph
      .replace(` xmlns="http://www.w3.org/2000/svg"`, "")
      .replace(/ class=["'].+?["']/, "")
      .replace("<symbol", `<symbol fill="currentColor"`),
  );
}

await Deno.writeTextFile(
  target,
  `<svg xmlns="http://www.w3.org/2000/svg">${glyphs.join("")}</svg>`,
);
