/** @jsxImportSource https://esm.sh/preact@10.11.0?pin=v67 */
import { classNames, ComponentChildren, VNode } from "../../../../deps.ts";
import { l } from "../../../i18n/mod.ts";

interface IBreadcrumbItem {
    (props: { title: string; active?: boolean; url?: string }): VNode;
}

export const BreadcrumbItem: IBreadcrumbItem = (props: { title: string; active?: boolean; url?: string }) => (
    props.active ? <li class="active">{props.title}</li> : <li>{props.url ? <a href={props.url}>{props.title}</a> : props.title}</li>
);

export type ItemProps = { title: string; url?: string };

export const Breadcrumb = (props: {
    noMargin?: boolean;
    children?: VNode<ItemProps>[] | VNode<ItemProps>;
}) => {
    const childArr = props.children ? (Array.isArray(props.children) ? props.children : [props.children]) : [];
    return (
        <ol class={classNames("breadcrumb", { mb: !props.noMargin })}>
            <BreadcrumbItem title={l.recipes} active={!childArr.length} url="/" />
            {childArr.map((item, i) => <BreadcrumbItem title={item.props.title} active={i === childArr.length - 1} url={item.props.url} />)}
        </ol>
    );
};
