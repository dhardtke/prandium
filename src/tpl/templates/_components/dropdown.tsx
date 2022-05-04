/** @jsxImportSource https://esm.sh/preact@10.7.1?pin=v66 */
import { classNames, ComponentChildren, VNode } from "../../../../deps.ts";
import { Collapsible } from "./collapsible.tsx";

export const Dropdown = (props: {
  label: VNode | string;
  labelClass?: string;
  spacing?: boolean;
  fullWidthMobile?: boolean;
  caret?: boolean | "right";
  children: VNode[];
  id: string;
}) => {
  return (
    <Collapsible id={props.id} label={props.label} labelClass={props.labelClass} caret={props.caret}>
      <ul class={classNames("dropdown", { "dropdown--with-spacing": props.spacing, "dropdown--full-width": props.fullWidthMobile })}>
        {props.children}
      </ul>
    </Collapsible>
  );
};

export const DropdownItem: AbstractDropdownItem<{
  active?: boolean;
  children: ComponentChildren;
}> = (props) => (
  <li>
    <div class={classNames("item", { active: props.active })}>
      {props.children}
    </div>
  </li>
);

export const DropdownDivider: AbstractDropdownItem<Record<string, unknown>> = () => <li className="divider"></li>;

export interface AbstractDropdownItem<P = void> {
  (props: P): VNode;
}
