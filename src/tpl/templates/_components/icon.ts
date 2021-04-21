import { e, html } from "../../mod.ts";

// TODO limit name to proper typings

export const Icon = (name: string, className?: string) =>
  html`
    <svg class="bi${className ? ` className` : ""}">
      <use xlink:href="/assets/icons.svg#${name}"/>
    </svg>
  `;

export const LabeledIcon = (
  label: unknown,
  name: string,
  spacing = 1,
  className?: string,
) =>
  html`<span class="me-${spacing}">${Icon(name, className)}</span>${e(label)}`;
