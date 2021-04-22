// deno-fmt-ignore-file
import { l } from "../../../i18n/mod.ts";
import { html } from "../../mod.ts";
import { Alert } from "../_components/alert.ts";
import { Page } from "../_structure/page.ts";

export const Error500 = () =>
  Page(l.error[500].title)(html`
    ${Alert("danger", l.error[500].title, l.error[500].description)}
  `);
