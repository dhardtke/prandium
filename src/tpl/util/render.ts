import { render, VNode } from "../../../deps.ts";

export function renderTemplate(template: VNode): string {
  return `<!DOCTYPE html>${render(template, undefined, { pretty: false })}`;
}
