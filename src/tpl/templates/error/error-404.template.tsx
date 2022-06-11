/** @jsxImportSource https://esm.sh/preact@10.7.3?pin=v66 */
import { l } from "../../../i18n/mod.ts";
import { Alert } from "../_components/alert.tsx";
import { Page } from "../_structure/page.tsx";

export const Error404 = () => (
  <Page title={l.error[404].title}>
    <Alert type="secondary" title={l.error[404].title}>
      {l.error[404].description}
    </Alert>
  </Page>
);
