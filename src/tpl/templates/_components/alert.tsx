/** @jsxImportSource https://esm.sh/preact@10.7.3?pin=v66 */
import { classNames, ComponentChildren } from "../../../../deps.ts";

export type AlertType =
  | "primary"
  | "secondary"
  | "info"
  | "danger"
  | "success"
  | "warning"
  | "dark"
  | "light";

export const Alert = (props: {
  type: AlertType;
  title: string;
  children: ComponentChildren;
  className?: string;
}) => (
  <div class={classNames("alert", `alert-${props.type}`, props.className)}>
    <h4>{props.title}</h4>
    {props.children}
  </div>
);
