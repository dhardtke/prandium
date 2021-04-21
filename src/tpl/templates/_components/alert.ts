import { e, html } from "../../mod.ts";

export type AlertType =
  | "primary"
  | "secondary"
  | "info"
  | "danger"
  | "success"
  | "warning"
  | "dark"
  | "light";

export const Alert = (
  type: AlertType,
  title: string,
  description: string,
  className?: string,
  escapeDescription = true,
) =>
  html`
  <div class="alert alert-${type}${
    className ? ` ${className}` : ""
  }" role="alert">
    <h4 class="alert-heading">${e(title)}</h4>
    ${escapeDescription ? e(description) : description}
  </div>`;
