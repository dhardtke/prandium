/** @jsxImportSource https://esm.sh/preact@10.11.0?pin=v67 */
import { classNames, VNode } from "../../../../deps.ts";

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

export const Icon = (props: { name: IconName; className?: string; large?: boolean }) => (
    <svg
        class={classNames("bi", props.className, { "lg": props.large })}
        dangerouslySetInnerHTML={{
            __html: `<use xlink:href="/assets/icons.svg#${props.name}"/>`,
        }}
    >
    </svg>
);

export const LabeledIcon = (props: {
    label: VNode | string;
    name: IconName;
    className?: string;
}) => (
    <>
        <Icon name={props.name} className={props.className ? `${props.className} labeled` : "labeled"} />
        {props.label}
    </>
);
