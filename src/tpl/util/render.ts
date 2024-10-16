import { render, VNode } from "../../../deps.ts";
import { BUILD_INFO } from "../../shared/util.ts";

let prettyTemplates = false;

export function shouldPrettifyTemplates(state: boolean): void {
    prettyTemplates = state;
}

export function renderTemplate(template: VNode): string {
    const buildInfoString = BUILD_INFO ? `<!-- ${BUILD_INFO} -->` : "";
    return `<!DOCTYPE html>\n${buildInfoString}${render(template, { pretty: prettyTemplates })}`;
}
