/** @jsxImportSource https://esm.sh/preact@10.10.0?pin=v66 */
import { classNames, ComponentChildren, VNode } from "../../../../deps.ts";

export const Collapsible = (props: {
    label?: VNode | string;
    labelClass?: string;
    wrapperClass?: string;
    children?: ComponentChildren;
    opened?: boolean;
    contentClass?: string;
    caret?: boolean | "right";
    id: string;
}) => (
    <div class={classNames("collapsible", props.wrapperClass)}>
        {props.label &&
            <label htmlFor={props.id} class={classNames(props.labelClass, { caret: props.caret, right: props.caret === "right" })}>{props.label}</label>}
        <input id={props.id} type="checkbox" checked={props.opened && true} autoComplete="off" />
        <div class={classNames("content", props.contentClass)}>
            {props.children}
        </div>
    </div>
);
