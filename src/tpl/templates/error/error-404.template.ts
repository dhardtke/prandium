// deno-fmt-ignore-file
import { l } from "../../../i18n/mod.ts";
import { html } from "../../mod.ts";
import { Alert } from "../_components/alert.ts";
import { Page } from "../_structure/page.ts";

export const Error404 = () =>
  Page(l.error[404].title)(html`
    ${Alert("secondary", l.error[404].title, l.error[404].description)}
  `);
