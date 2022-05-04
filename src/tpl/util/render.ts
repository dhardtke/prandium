import { render, VNode } from "../../../deps.ts";

let prettyTemplates = false;
export function shouldPrettifyTemplates(state: boolean): void {
  prettyTemplates = state;
}

export function renderTemplate(template: VNode): string {
  return `<!DOCTYPE html>${render(template, undefined, { pretty: prettyTemplates })}`;
}
