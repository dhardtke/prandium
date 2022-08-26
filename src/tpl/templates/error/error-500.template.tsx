/** @jsxImportSource https://esm.sh/preact@10.10.6?pin=v67 */
import { l } from "../../../i18n/mod.ts";
import { Alert } from "../_components/alert.tsx";
import { Page } from "../_structure/page.tsx";

export const Error500 = () => (
    <Page title={l.error[500].title}>
        <Alert type={"danger"} title={l.error[500].title}>
            {l.error[500].description}
        </Alert>
    </Page>
);
