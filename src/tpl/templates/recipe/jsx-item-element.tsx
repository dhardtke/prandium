// @ts-nocheck Suppress false-positive "Property 'template' does not exist on type 'JSX.IntrinsicElements'"
import type { ComponentChildren } from "preact";

export const Template = (props: { children: ComponentChildren }) => (
    <template>
        {props.children}
    </template>
);
