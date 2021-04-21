import { html } from "../../mod.ts";
import { t } from "../../util/translation.ts";
import { Alert } from "../_components/alert.ts";
import { PageTemplate } from "../_structure/page.template.ts";

export const Error500 = () =>
  PageTemplate(t("error.500.title"))(html`
  ${Alert("danger", t("error.500.title"), t("error.500.description"))}
`);
