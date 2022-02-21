// deno-fmt-ignore-file
import { e, html } from "../../mod.ts";
import { asset } from "../../util/asset.ts";

export const ICONS = [
  "arrow-left-short",
  "arrow-right-short",
  "journal-richtext",
  "sun-fill",
  "moon",
  "globe",
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
  "check",
  "flag",
  "flag-fill",
  "house-door",
] as const;

export type IconName = typeof ICONS[number];

export const Icon = (name: IconName, className?: string) =>
  html`
    <svg class="bi${className && ` ${className}`}">
      <use xlink:href="/assets/icons.svg#${name}"/>
    </svg>
  `;

export const LabeledIcon = (
  label: unknown,
  name: IconName,
  className?: string,
) => html`${Icon(name, className ? `${className} labeled` : "labeled")}${e(label)}`;
