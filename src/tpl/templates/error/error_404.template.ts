import { html } from "../../mod.ts";
import { t } from "../../util/translation.ts";
import { Alert } from "../_components/alert.ts";
import { Page } from "../_structure/page.ts";

export const Error404 = () =>
  Page(t("error.404.title"))(html`
  ${Alert("secondary", t("error.404.title"), t("error.404.description"))}
`);
